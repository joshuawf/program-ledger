import React, { useState, useMemo, useEffect } from "react";
import { supabase, supabaseEnabled } from "./supabaseClient.js";
import { computeDerivedRows, computeFlags, periodSortKey } from "./dataEngine.js";
import Papa from "papaparse";

const SMALL_COHORT_THRESHOLD = 5;

// ── Lineage: remap raw rows (not derived averages) so combined history ──
// recomputes correctly — founding dates, rolling windows, everything just
// falls out of the merged history naturally instead of being patched after
// the fact.
function rowKeyOf(location, program, degree) { return `${location}|${program}|${degree}`; }

function resolveLineageTarget(key, remap) {
  let seen = new Set();
  while (remap.has(key) && !seen.has(key)) {
    seen.add(key);
    key = remap.get(key);
  }
  return key;
}

function applyLineageToRawRows(enrollmentRows, graduationRows, employmentRows, lineage) {
  if (lineage.length === 0) return { enrollmentRows, graduationRows, employmentRows, predecessorMap: new Map() };
  const remap = new Map(lineage.map(l => [l.fromKey, l.toKey]));
  function remapRow(r) {
    const key = rowKeyOf(r.location, r.program, r.degree);
    const target = resolveLineageTarget(key, remap);
    if (target === key) return r;
    const [location, program, degree] = target.split('|');
    return { ...r, location, program, degree };
  }
  const predecessorMap = new Map();
  lineage.forEach(l => {
    const finalKey = resolveLineageTarget(l.toKey, remap);
    if (!predecessorMap.has(finalKey)) predecessorMap.set(finalKey, []);
    predecessorMap.get(finalKey).push({ label: l.fromLabel, note: l.note });
  });
  return {
    enrollmentRows: enrollmentRows.map(remapRow),
    graduationRows: graduationRows.map(remapRow),
    employmentRows: employmentRows.map(remapRow),
    predecessorMap,
  };
}

function rowLabel(r) { return `${r.program} — ${r.degree} (${r.location})`; }

// Supabase caps a single query at 1000 rows by default. Our enrollment table
// has 9000+ rows, so a plain .select() silently truncates — this pages
// through in batches until everything's been pulled, however large the
// table grows over time.
async function fetchAllRows(query, pageSize = 1000) {
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    all = all.concat(data);
    if (data.length < pageSize) break; // last page was partial — we've got everything
    from += pageSize;
  }
  return { data: all, error: null };
}

function foundingText(r) {
  if (r.foundedOverridden) {
    return { short: r.founded, full: `Manually set: ${r.founded}${r.foundedNote ? ' — ' + r.foundedNote : ''}` };
  }
  if (!r.founded) return { short: 'Unknown', full: 'No enrollment history on record for this program/degree/location — founding date can\u2019t be inferred.' };
  if (r.founded.startsWith('Pre-')) return { short: r.founded, full: `Enrolled students were already recorded at the very start of the data on file — so this program predates our records rather than being newly founded then.` };
  return { short: `Est. ${r.founded}`, full: `First recorded enrollment: ${r.founded} (earliest non-zero quarter on record).` };
}

function Sparkline({ values, color, height = 28, width = 100 }) {
  if (!values || values.length === 0) {
    return <div style={{ height, width }} className="flex items-center text-[10px] text-stone-400 font-mono">n/a</div>;
  }
  const max = Math.max(...values, 1);
  const barW = width / values.length;
  return (
    <svg width={width} height={height} className="overflow-visible">
      {values.map((v, i) => {
        const h = Math.max((v / max) * (height - 4), v === 0 ? 1 : 2);
        return <rect key={i} x={i * barW + 1} y={height - h} width={barW - 2} height={h} fill={color} rx={1} />;
      })}
    </svg>
  );
}

function TrendArrow({ trend }) {
  if (!trend) return null;
  const config = {
    rising: { glyph: '\u2197', color: '#3F6B52', label: 'Rising over this window' },
    falling: { glyph: '\u2198', color: '#B8462F', label: 'Falling over this window' },
    flat: { glyph: '\u2192', color: '#8A8F86', label: 'Roughly flat over this window' },
  }[trend];
  if (!config) return null;
  return (
    <span className="font-mono text-sm ml-1" style={{ color: config.color }} title={config.label}>
      {config.glyph}
    </span>
  );
}

function FlagStamp({ severity, flags }) {
  if (!severity) return <span className="text-[11px] font-mono text-stone-400">{'\u2014'}</span>;
  const isRed = severity === 'red';
  const color = isRed ? '#B8462F' : '#B8860B';
  return (
    <div
      className="inline-flex items-center justify-center rounded-full border-2 font-serif font-bold uppercase tracking-wide"
      style={{ borderColor: color, color: color, fontSize: '9px', padding: '3px 9px', transform: 'rotate(-4deg)', letterSpacing: '0.06em', background: isRed ? 'rgba(184,70,47,0.06)' : 'rgba(184,134,11,0.08)' }}
      title={flags.map(f => f.label).join('; ')}
    >
      flagged &times;{flags.length}
    </div>
  );
}

function SmallCohortBadge({ cohortSize, degree }) {
  return (
    <span className="inline-flex items-center text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border"
      style={{ color: '#8A8F86', borderColor: '#C9C4B4', background: 'transparent' }}
      title={`Only ${cohortSize} ${degree} program(s) in the current view — percentile-based flags carry less statistical weight with this few data points.`}>
      small n={cohortSize}
    </span>
  );
}

function RetiredBadge() {
  return (
    <span className="inline-flex items-center text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border border-dashed"
      style={{ color: '#8A8F86', borderColor: '#8A8F86', background: 'transparent' }}
      title="Marked retired/legacy — excluded from flag thresholds and percentile math for the whole cohort.">
      retired
    </span>
  );
}

// Deliberately a different shape/color from FlagStamp's rust circle — this is a
// different kind of concern (completion, not scale) and shouldn't be confused
// with "this program is just small."
function CompletionBadge() {
  return (
    <span className="inline-flex items-center text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded"
      style={{ color: '#7C5B8A', border: '1px solid #7C5B8A', background: 'rgba(124,91,138,0.08)' }}
      title="Enrollment isn't shrinking, but graduation output is — a completion/attrition pattern, not a scale problem. Based on trend comparison, not true cohort tracking (this data has no student IDs to follow an actual cohort through).">
      &#8595; completion
    </span>
  );
}

// For a program offered at multiple degree levels (same location), shows whether
// the mix between them has shifted — e.g. BFA holding steady while MFA quietly
// shrinks toward zero. Uses the same early-half/late-half split as the trend
// arrows, applied to enrollment (the metric every degree level reliably has).
function DegreeMixPanel({ row, allRows }) {
  const siblings = allRows.filter(r => r.location === row.location && r.program === row.program && r.enrWindowVals);
  if (siblings.length < 2) return null;

  const splitShares = siblings.map(s => {
    const vals = s.enrWindowVals;
    const mid = Math.ceil(vals.length / 2);
    const early = vals.slice(0, mid).reduce((a, b) => a + b, 0);
    const late = vals.slice(vals.length - mid).reduce((a, b) => a + b, 0);
    return { degree: s.degree, early, late };
  });
  const earlyTotal = splitShares.reduce((sum, s) => sum + s.early, 0);
  const lateTotal = splitShares.reduce((sum, s) => sum + s.late, 0);
  if (earlyTotal === 0 && lateTotal === 0) return null;

  return (
    <div className="border-t pt-5" style={{ borderColor: '#A98F62' }}>
      <div className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: '#8A8F86' }}>
        Degree mix at {row.location} — early vs. late in the Winter window
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left font-sans font-medium pb-1" style={{ color: '#6B6455' }}>Degree</th>
            <th className="text-right font-sans font-medium pb-1" style={{ color: '#6B6455' }}>Early share</th>
            <th className="text-right font-sans font-medium pb-1" style={{ color: '#6B6455' }}>Late share</th>
          </tr>
        </thead>
        <tbody>
          {splitShares.map(s => {
            const earlyPct = earlyTotal > 0 ? (s.early / earlyTotal) * 100 : 0;
            const latePct = lateTotal > 0 ? (s.late / lateTotal) * 100 : 0;
            const isCurrentRow = s.degree === row.degree;
            return (
              <tr key={s.degree} style={{ background: isCurrentRow ? 'rgba(63,107,82,0.08)' : 'transparent' }}>
                <td className="py-1 font-mono" style={{ color: '#33312D', fontWeight: isCurrentRow ? 700 : 400 }}>{s.degree}</td>
                <td className="py-1 text-right font-mono" style={{ color: '#33312D' }}>{earlyPct.toFixed(0)}%</td>
                <td className="py-1 text-right font-mono" style={{ color: latePct + 10 < earlyPct ? '#B8462F' : '#33312D' }}>{latePct.toFixed(0)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="text-[10px] font-sans mt-2" style={{ color: '#8A8F86' }}>
        Share of this program's total enrollment held by each degree level, comparing the first vs. second half of the current Winter window.
      </div>
    </div>
  );
}

function DetailDrawer({ row, onClose, cohortLabel, allRows }) {
  if (!row) return null;
  const ft = foundingText(row);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(27,42,65,0.35)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto shadow-2xl" style={{ background: '#EEF1EC' }} onClick={e => e.stopPropagation()}>
        <div className="p-6" style={{ background: '#1B2A41' }}>
          <button onClick={onClose} className="text-xs font-sans mb-4" style={{ color: '#A9B7C8' }}>&larr; Close</button>
          <div className="text-[11px] font-mono uppercase tracking-widest mb-1" style={{ color: '#7C9885' }}>{row.location} &middot; {row.degree}</div>
          <h2 className="font-serif text-2xl leading-tight" style={{ color: '#F1F0EA' }}>{row.program}</h2>
          <div className="text-xs font-mono mt-2" style={{ color: '#A9B7C8' }}>{ft.full}</div>
          {row.isRetired && (
            <div className="text-xs font-sans mt-2 inline-block px-2 py-1 rounded border border-dashed" style={{ color: '#C9C4B4', borderColor: '#5A6B80' }}>
              Marked retired — excluded from all flag thresholds
            </div>
          )}
          {row.predecessors && row.predecessors.length > 0 && (
            <div className="text-xs font-sans mt-2" style={{ color: '#7C9885' }}>
              Formerly: {row.predecessors.map((p, i) => (
                <span key={i}>{p.label}{p.note ? ` — ${p.note}` : ''}{i < row.predecessors.length - 1 ? '; ' : ''}</span>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: '#8A8F86' }}>
              Flag rationale — computed against {cohortLabel}
            </div>
            {row.flags.length === 0 ? (
              <div className="text-sm font-sans" style={{ color: '#33312D' }}>No flags under current filters.</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  {row.flags.map(f => (
                    <span key={f.code} className="text-xs font-sans px-2 py-1 rounded" style={{ background: 'rgba(184,70,47,0.1)', color: '#B8462F' }}>{f.label}</span>
                  ))}
                </div>
                {row.yellowFlagged && (
                  <div className="text-xs font-sans p-2 rounded" style={{ background: 'rgba(184,134,11,0.08)', color: '#8A6D1F', border: '1px solid rgba(184,134,11,0.3)' }}>
                    Yellow flag — one concern out of three (enrollment, graduation, employment). Worth watching, not yet a red flag.
                  </div>
                )}
                {row.redFlagged && (
                  <div className="text-xs font-sans p-2 rounded" style={{ background: 'rgba(184,70,47,0.08)', color: '#B8462F', border: '1px solid rgba(184,70,47,0.3)' }}>
                    Red flag — {row.concernCount} of 3 concerns (enrollment, graduation, employment).
                  </div>
                )}
              </>
            )}
            {row.smallCohort && (
              <div className="text-xs font-sans mt-2 p-2 rounded" style={{ background: '#F1EEE3', color: '#6B6455', border: '1px solid #C9C4B4' }}>
                Only <strong>{row.cohortSize}</strong> {row.degree} program{row.cohortSize === 1 ? '' : 's'} exist in this view. Percentile-based flags for small degree groups like this are less statistically meaningful — read the raw averages above the flag.
              </div>
            )}
          </div>

          <div className="border-t pt-5" style={{ borderColor: '#A98F62' }}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#8A8F86' }}>Enrollment, per Winter qtr</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#1B2A41' }}>avg {row.enrAvgVal !== null ? row.enrAvgVal.toFixed(1) : '\u2014'}</div>
            </div>
            {row.enrAvgVal !== null ? (
              <>
                <div className="flex items-end gap-1 h-16 mb-1">
                  {row.enrWindowVals.map((v, i) => {
                    const max = Math.max(...row.enrWindowVals, 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div style={{ height: `${Math.max((v / max) * 100, 2)}%`, background: '#3F6B52', width: '70%', borderRadius: '2px 2px 0 0' }} />
                        <div className="text-[10px] font-mono" style={{ color: '#33312D' }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {row.enrWindowPeriods.map((p, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] font-mono" style={{ color: '#8A8F86' }}>{p.replace('Winter ', "W'")}</div>
                  ))}
                </div>
              </>
            ) : <div className="text-sm font-mono text-stone-400">No enrollment data for this location.</div>}
          </div>

          <div className="border-t pt-5" style={{ borderColor: '#A98F62' }}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#8A8F86' }}>Graduates, per year</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#1B2A41' }}>avg {row.gradAvgVal !== null ? row.gradAvgVal.toFixed(1) : '\u2014'}</div>
            </div>
            {row.gradAvgVal !== null || row.gradDisplayVals?.some(v => v > 0) ? (
              <>
                <div className="flex items-end gap-1 h-16 mb-1">
                  {row.gradDisplayVals.map((v, i) => {
                    const max = Math.max(...row.gradDisplayVals, 1);
                    const partial = row.gradDisplayYears[i] === row.gradPartialYear;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div style={{ height: `${Math.max((v / max) * 100, 2)}%`, background: partial ? '#B8462F55' : '#1B2A41', width: '70%', borderRadius: '2px 2px 0 0' }} />
                        <div className="text-[10px] font-mono" style={{ color: '#33312D' }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {row.gradDisplayYears.map((y, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] font-mono" style={{ color: y === row.gradPartialYear ? '#B8462F' : '#8A8F86' }}>{y}{y === row.gradPartialYear ? '*' : ''}</div>
                  ))}
                </div>
                <div className="text-[10px] font-sans mt-2" style={{ color: '#8A8F86' }}>* partial year, excluded from average</div>
              </>
            ) : <div className="text-sm font-mono text-stone-400">No graduation data for this location.</div>}
          </div>

          <div className="border-t pt-5" style={{ borderColor: '#A98F62' }}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#8A8F86' }}>Employment, field-related %</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#1B2A41' }}>avg {row.empAvgVal !== null ? `${(row.empAvgVal * 100).toFixed(0)}%` : '\u2014'}</div>
            </div>
            {row.empAvgVal !== null || row.empDisplayVals?.some(v => v !== null) ? (
              <>
                <div className="flex items-end gap-1 h-16 mb-1">
                  {row.empDisplayVals.map((v, i) => {
                    const partial = row.empDisplayYears[i] === row.empPartialYear;
                    const pct = v === null ? 0 : v * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div style={{ height: `${Math.max(pct, v === null ? 0 : 2)}%`, background: partial ? '#7C5B8A55' : '#7C5B8A', width: '70%', borderRadius: '2px 2px 0 0' }} />
                        <div className="text-[10px] font-mono" style={{ color: '#33312D' }}>{v === null ? '\u2014' : `${pct.toFixed(0)}%`}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {row.empDisplayYears.map((y, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] font-mono" style={{ color: y === row.empPartialYear ? '#B8462F' : '#8A8F86' }}>{y}{y === row.empPartialYear ? '*' : ''}</div>
                  ))}
                </div>
                <div className="text-[10px] font-sans mt-2" style={{ color: '#8A8F86' }}>Average is weighted by graduate count per year, not a plain average of yearly percentages.</div>
              </>
            ) : <div className="text-sm font-mono text-stone-400">No employment data for this location.</div>}
          </div>

          <DegreeMixPanel row={row} allRows={allRows} />
        </div>
      </div>
    </div>
  );
}

// Side-by-side view for programs offered at 2+ campuses — opt-in via a tab
// toggle rather than always-on, so the main ledger stays uncluttered.
function CompareLocationsView({ rows, onSelect }) {
  const LOCS = ['Savannah', 'Atlanta', 'SCADnow'];
  const grouped = new Map();
  rows.filter(r => LOCS.includes(r.location)).forEach(r => {
    const key = `${r.program}|${r.degree}`;
    if (!grouped.has(key)) grouped.set(key, { program: r.program, degree: r.degree, byLoc: {} });
    grouped.get(key).byLoc[r.location] = r;
  });
  const multiLocation = Array.from(grouped.values())
    .filter(g => Object.keys(g.byLoc).length >= 2)
    .sort((a, b) => a.program.localeCompare(b.program));

  if (multiLocation.length === 0) {
    return <div className="text-sm font-sans px-4 py-10 text-center" style={{ color: '#8A8F86' }}>No programs in the current filters are offered at more than one campus.</div>;
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #DDD7C8', background: '#F8F7F2' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: '#1B2A41' }}>
            <th className="text-left px-4 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Program / Degree</th>
            {LOCS.map(loc => (
              <th key={loc} className="text-center px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>{loc}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {multiLocation.map((g, i) => (
            <tr key={g.program + g.degree} style={{ borderTop: i === 0 ? 'none' : '1px solid #E5E0D3' }}>
              <td className="px-4 py-3">
                <div className="font-serif" style={{ color: '#1B2A41' }}>{g.program}</div>
                <div className="font-mono text-[10px]" style={{ color: '#8A8F86' }}>{g.degree}</div>
              </td>
              {LOCS.map(loc => {
                const r = g.byLoc[loc];
                if (!r) return <td key={loc} className="px-3 py-3 text-center font-mono text-xs" style={{ color: '#C9C4B4' }}>not offered</td>;
                return (
                  <td key={loc} className="px-3 py-3 text-center cursor-pointer hover:bg-black/[0.03]" onClick={() => onSelect(r)}>
                    <div className="font-mono text-xs" style={{ color: '#1B2A41' }}>
                      E: <strong>{r.enrAvgVal !== null ? r.enrAvgVal.toFixed(1) : '\u2014'}</strong>
                      {' '}&middot;{' '}
                      G: <strong>{r.gradAvgVal !== null ? r.gradAvgVal.toFixed(1) : '\u2014'}</strong>
                      {' '}&middot;{' '}
                      Emp: <strong>{r.empAvgVal !== null ? `${(r.empAvgVal * 100).toFixed(0)}%` : '\u2014'}</strong>
                    </div>
                    <div className="mt-1">
                      {r.isRetired ? <RetiredBadge /> : <FlagStamp severity={r.redFlagged ? 'red' : r.yellowFlagged ? 'yellow' : null} flags={r.flags} />}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManagePanel({ raw, legacyKeys, setLegacyKeys, lineage, setLineage, foundingOverrides, setFoundingOverrides, onClose }) {
  const [tab, setTab] = useState('retire');
  const [retireSel, setRetireSel] = useState("");
  const [fromSel, setFromSel] = useState("");
  const [toSel, setToSel] = useState("");
  const [note, setNote] = useState("");
  const [overrideSel, setOverrideSel] = useState("");
  const [overrideLabel, setOverrideLabel] = useState("");
  const [overrideNote, setOverrideNote] = useState("");

  const options = useMemo(() => raw.slice().sort((a, b) => rowLabel(a).localeCompare(rowLabel(b))), [raw]);
  const linkedFromKeys = new Set(lineage.map(l => l.fromKey));
  const selectStyle = { background: '#233450', color: '#F1F0EA', border: '1px solid #33425C' };

  async function addRetire() {
    if (!retireSel) return;
    const key = retireSel;
    setLegacyKeys(prev => new Set(prev).add(key));
    setRetireSel("");
    if (supabaseEnabled) {
      const { error } = await supabase.from('retirements').insert({ key });
      if (error && error.code !== '23505') { console.error(error); setLegacyKeys(prev => { const n = new Set(prev); n.delete(key); return n; }); }
    }
  }
  async function removeRetire(key) {
    setLegacyKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    if (supabaseEnabled) {
      const { error } = await supabase.from('retirements').delete().eq('key', key);
      if (error) console.error(error);
    }
  }
  async function addLink() {
    if (!fromSel || !toSel || fromSel === toSel) return;
    const newLink = { fromKey: fromSel, toKey: toSel, note, fromLabel: rowLabel(options.find(o => rowKeyOf(o.location, o.program, o.degree) === fromSel)), toLabel: rowLabel(options.find(o => rowKeyOf(o.location, o.program, o.degree) === toSel)) };
    setFromSel(""); setToSel(""); setNote("");
    if (supabaseEnabled) {
      const { data, error } = await supabase.from('lineage_links').insert({ from_key: newLink.fromKey, to_key: newLink.toKey, from_label: newLink.fromLabel, to_label: newLink.toLabel, note: newLink.note }).select().single();
      if (error) { console.error(error); return; }
      setLineage(prev => [...prev, { ...newLink, id: data.id }]);
    } else {
      setLineage(prev => [...prev, newLink]);
    }
  }
  async function removeLink(link) {
    setLineage(prev => prev.filter(l => l !== link));
    if (supabaseEnabled && link.id != null) {
      const { error } = await supabase.from('lineage_links').delete().eq('id', link.id);
      if (error) console.error(error);
    }
  }
  async function addOverride() {
    if (!overrideSel || !overrideLabel.trim()) return;
    const key = overrideSel;
    const entry = { key, founded_label: overrideLabel.trim(), note: overrideNote.trim() || null };
    setFoundingOverrides(prev => [...prev.filter(o => o.key !== key), entry]);
    setOverrideSel(""); setOverrideLabel(""); setOverrideNote("");
    if (supabaseEnabled) {
      const { error } = await supabase.from('founding_overrides').upsert(entry);
      if (error) console.error(error);
    }
  }
  async function removeOverride(key) {
    setFoundingOverrides(prev => prev.filter(o => o.key !== key));
    if (supabaseEnabled) {
      const { error } = await supabase.from('founding_overrides').delete().eq('key', key);
      if (error) console.error(error);
    }
  }

  const tabs = [
    { id: 'retire', label: 'Retirements' },
    { id: 'lineage', label: 'Rename / merge' },
    { id: 'founding', label: 'Founding dates' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(27,42,65,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl" style={{ background: '#EEF1EC' }} onClick={e => e.stopPropagation()}>
        <div className="p-6 flex items-start justify-between" style={{ background: '#1B2A41' }}>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: '#7C9885' }}>Ledger maintenance</div>
            <h2 className="font-serif text-xl" style={{ color: '#F1F0EA' }}>Manage the ledger</h2>
          </div>
          <button onClick={onClose} className="text-xs font-sans" style={{ color: '#A9B7C8' }}>&times; Close</button>
        </div>

        <div className="px-6 pt-4 flex gap-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="text-xs font-sans px-3 py-1.5 rounded-t"
              style={{ background: tab === t.id ? '#F8F7F2' : 'transparent', color: tab === t.id ? '#1B2A41' : '#6B6455', fontWeight: tab === t.id ? 600 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6" style={{ background: '#F8F7F2' }}>
          <div className="text-xs font-sans px-3 py-2 rounded"
            style={supabaseEnabled ? { background: 'rgba(63,107,82,0.12)', color: '#3F6B52' } : { background: 'rgba(184,70,47,0.1)', color: '#B8462F' }}>
            {supabaseEnabled
              ? '\u2713 Connected to Supabase — changes here are saved for everyone, permanently.'
              : '\u26a0 Not connected to a database — changes here only last for this browser tab.'}
          </div>

          {tab === 'retire' && (
            <section>
              <p className="text-xs font-sans mb-3" style={{ color: '#6B6455' }}>Retired programs stay on the ledger but are dropped from every flag threshold and percentile calculation.</p>
              <div className="flex gap-2 mb-3">
                <select value={retireSel} onChange={e => setRetireSel(e.target.value)} className="flex-1 text-sm font-sans px-3 py-2 rounded outline-none" style={selectStyle}>
                  <option value="">Select a program/degree/location&hellip;</option>
                  {options.map(o => <option key={rowKeyOf(o.location, o.program, o.degree)} value={rowKeyOf(o.location, o.program, o.degree)}>{rowLabel(o)}</option>)}
                </select>
                <button onClick={addRetire} className="px-4 py-2 rounded text-sm font-sans font-medium" style={{ background: '#3F6B52', color: '#F1F0EA' }}>Retire</button>
              </div>
              {legacyKeys.size === 0 ? (
                <div className="text-xs font-sans italic" style={{ color: '#8A8F86' }}>Nothing marked retired yet.</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {Array.from(legacyKeys).map(key => (
                    <div key={key} className="flex items-center justify-between text-xs font-sans px-3 py-2 rounded" style={{ background: '#F1EEE3', border: '1px solid #C9C4B4' }}>
                      <span style={{ color: '#33312D' }}>{key.split('|').join('  \u2014  ')}</span>
                      <button onClick={() => removeRetire(key)} className="font-mono" style={{ color: '#B8462F' }}>remove</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'lineage' && (
            <section>
              <p className="text-xs font-sans mb-3" style={{ color: '#6B6455' }}>If Program A became Program B, link them here. Their full enrollment/graduation history combines under B automatically — founding date, averages, everything recomputes from the merged history.</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select value={fromSel} onChange={e => setFromSel(e.target.value)} className="text-sm font-sans px-3 py-2 rounded outline-none" style={selectStyle}>
                  <option value="">Old name (predecessor)&hellip;</option>
                  {options.filter(o => !linkedFromKeys.has(rowKeyOf(o.location, o.program, o.degree))).map(o => <option key={rowKeyOf(o.location, o.program, o.degree)} value={rowKeyOf(o.location, o.program, o.degree)}>{rowLabel(o)}</option>)}
                </select>
                <select value={toSel} onChange={e => setToSel(e.target.value)} className="text-sm font-sans px-3 py-2 rounded outline-none" style={selectStyle}>
                  <option value="">New name (successor)&hellip;</option>
                  {options.map(o => <option key={rowKeyOf(o.location, o.program, o.degree)} value={rowKeyOf(o.location, o.program, o.degree)}>{rowLabel(o)}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mb-3">
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note, e.g. renamed Fall 2019" className="flex-1 text-sm font-sans px-3 py-2 rounded outline-none placeholder:text-stone-500" style={selectStyle} />
                <button onClick={addLink} className="px-4 py-2 rounded text-sm font-sans font-medium" style={{ background: '#3F6B52', color: '#F1F0EA' }}>Link</button>
              </div>
              {lineage.length === 0 ? (
                <div className="text-xs font-sans italic" style={{ color: '#8A8F86' }}>No lineage links recorded yet.</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {lineage.map((l, i) => (
                    <div key={l.id ?? i} className="flex items-center justify-between text-xs font-sans px-3 py-2 rounded" style={{ background: '#F1EEE3', border: '1px solid #C9C4B4' }}>
                      <span style={{ color: '#33312D' }}>{l.fromLabel} &rarr; {l.toLabel}{l.note ? ` (${l.note})` : ''}</span>
                      <button onClick={() => removeLink(l)} className="font-mono" style={{ color: '#B8462F' }}>remove</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'founding' && (
            <section>
              <p className="text-xs font-sans mb-3" style={{ color: '#6B6455' }}>The founding date shown for each program is inferred from its earliest enrollment record. If you know the real launch date and it disagrees, set it here — your value always wins over the inferred one.</p>
              <div className="flex gap-2 mb-2">
                <select value={overrideSel} onChange={e => setOverrideSel(e.target.value)} className="flex-1 text-sm font-sans px-3 py-2 rounded outline-none" style={selectStyle}>
                  <option value="">Select a program/degree/location&hellip;</option>
                  {options.map(o => <option key={rowKeyOf(o.location, o.program, o.degree)} value={rowKeyOf(o.location, o.program, o.degree)}>{rowLabel(o)}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mb-3">
                <input value={overrideLabel} onChange={e => setOverrideLabel(e.target.value)} placeholder='Founding label, e.g. "Fall 2016" or "Pre-2010"' className="flex-1 text-sm font-sans px-3 py-2 rounded outline-none placeholder:text-stone-500" style={selectStyle} />
                <input value={overrideNote} onChange={e => setOverrideNote(e.target.value)} placeholder="Optional note" className="flex-1 text-sm font-sans px-3 py-2 rounded outline-none placeholder:text-stone-500" style={selectStyle} />
                <button onClick={addOverride} className="px-4 py-2 rounded text-sm font-sans font-medium" style={{ background: '#3F6B52', color: '#F1F0EA' }}>Set</button>
              </div>
              {foundingOverrides.length === 0 ? (
                <div className="text-xs font-sans italic" style={{ color: '#8A8F86' }}>No manual founding dates set yet.</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {foundingOverrides.map(o => (
                    <div key={o.key} className="flex items-center justify-between text-xs font-sans px-3 py-2 rounded" style={{ background: '#F1EEE3', border: '1px solid #C9C4B4' }}>
                      <span style={{ color: '#33312D' }}>{o.key.split('|').join('  \u2014  ')}: <strong>{o.founded_label}</strong>{o.note ? ` (${o.note})` : ''}</span>
                      <button onClick={() => removeOverride(o.key)} className="font-mono" style={{ color: '#B8462F' }}>remove</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadPanel({ onClose, onImported }) {
  const [fileType, setFileType] = useState('enrollment');
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const requiredCols = fileType === 'enrollment'
    ? ['location', 'program', 'degree', 'period', 'period_sort', 'count']
    : fileType === 'graduation'
    ? ['location', 'program', 'degree', 'year', 'count']
    : ['location', 'program', 'degree', 'year', 'unrelated', 'creative', 'total'];

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setDone(false);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const cols = results.meta.fields || [];
        const missing = requiredCols.filter(c => !cols.includes(c));
        if (missing.length > 0) {
          setError(`Missing column(s): ${missing.join(', ')}. Expected: ${requiredCols.join(', ')}`);
          setParsed(null);
          return;
        }
        setParsed(results.data);
      },
      error: (err) => setError(err.message),
    });
  }

  async function confirmImport() {
    if (!parsed || !supabaseEnabled) return;
    setSaving(true);
    setError(null);
    const table = fileType;
    const rows = parsed.map(r => {
      if (fileType === 'enrollment') {
        return { location: String(r.location), program: String(r.program), degree: String(r.degree), period: String(r.period), period_sort: Number(r.period_sort), count: Number(r.count) };
      }
      if (fileType === 'graduation') {
        return { location: String(r.location), program: String(r.program), degree: String(r.degree), year: Number(r.year), count: Number(r.count) };
      }
      return { location: String(r.location), program: String(r.program), degree: String(r.degree), year: Number(r.year), unrelated: Number(r.unrelated), creative: Number(r.creative), total: Number(r.total) };
    });
    // Insert in batches to stay well under request size limits
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error: err } = await supabase.from(table).insert(batch);
      if (err) { setError(err.message); setSaving(false); return; }
    }
    setSaving(false);
    setDone(true);
    onImported();
  }

  const preview = parsed ? parsed.slice(0, 8) : null;
  const totalNew = parsed ? parsed.reduce((s, r) => s + (Number(r.count) || Number(r.total) || 0), 0) : 0;
  const uniquePrograms = parsed ? new Set(parsed.map(r => `${r.location}|${r.program}|${r.degree}`)).size : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(27,42,65,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl" style={{ background: '#EEF1EC' }} onClick={e => e.stopPropagation()}>
        <div className="p-6 flex items-start justify-between" style={{ background: '#1B2A41' }}>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: '#7C9885' }}>Add new data</div>
            <h2 className="font-serif text-xl" style={{ color: '#F1F0EA' }}>Upload enrollment, graduation, or employment data</h2>
          </div>
          <button onClick={onClose} className="text-xs font-sans" style={{ color: '#A9B7C8' }}>&times; Close</button>
        </div>

        <div className="p-6 space-y-5">
          {!supabaseEnabled && (
            <div className="text-xs font-sans px-3 py-2 rounded" style={{ background: 'rgba(184,70,47,0.1)', color: '#B8462F' }}>
              Not connected to a database — uploads won't save anywhere. Connect Supabase first (see README).
            </div>
          )}

          <div className="flex gap-2">
            {['enrollment', 'graduation', 'employment'].map(t => (
              <button key={t} onClick={() => { setFileType(t); setParsed(null); setDone(false); }} className="text-sm font-sans px-4 py-2 rounded capitalize"
                style={{ background: fileType === t ? '#1B2A41' : 'transparent', color: fileType === t ? '#F1F0EA' : '#6B6455', border: '1px solid #1B2A41' }}>
                {t}
              </button>
            ))}
          </div>

          <div className="text-xs font-sans p-3 rounded" style={{ background: '#F1EEE3', color: '#6B6455', border: '1px solid #C9C4B4' }}>
            CSV must have these exact column headers: <strong>{requiredCols.join(', ')}</strong>
            {fileType === 'enrollment' && <> — <code>period</code> is like "Winter 2027", <code>period_sort</code> is an integer where higher = later (ask if you're not sure how to compute this for a new period).</>}
            {fileType === 'employment' && <> — <code>total</code> is graduates surveyed, <code>creative</code> is how many landed field-related work, <code>unrelated</code> is the rest of <code>total</code> (total should equal unrelated + creative).</>}
          </div>

          <input type="file" accept=".csv" onChange={handleFile} className="text-sm font-sans" />

          {error && <div className="text-xs font-sans px-3 py-2 rounded" style={{ background: 'rgba(184,70,47,0.1)', color: '#B8462F' }}>{error}</div>}

          {preview && (
            <div>
              <div className="text-sm font-sans mb-2" style={{ color: '#33312D' }}>
                <strong>{fileName}</strong>: {parsed.length} rows, {uniquePrograms} program/degree/location combinations, {totalNew.toLocaleString()} total {fileType === 'enrollment' ? 'enrolled students' : 'graduates'} across this file.
              </div>
              <div className="text-xs font-mono mb-2" style={{ color: '#8A8F86' }}>Preview (first 8 rows):</div>
              <div className="rounded overflow-hidden border" style={{ borderColor: '#DDD7C8' }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: '#1B2A41' }}>{requiredCols.map(c => <th key={c} className="text-left px-2 py-1 font-sans" style={{ color: '#F1F0EA' }}>{c}</th>)}</tr></thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid #E5E0D3' }}>
                        {requiredCols.map(c => <td key={c} className="px-2 py-1 font-mono" style={{ color: '#33312D' }}>{String(r[c])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs font-sans mt-2 italic" style={{ color: '#8A8F86' }}>
                This adds new rows — it doesn't delete or overwrite existing ones. If you upload the same period twice, counts will double up, so only upload each period once.
              </div>
              {!done ? (
                <button onClick={confirmImport} disabled={saving || !supabaseEnabled} className="mt-3 px-4 py-2 rounded text-sm font-sans font-medium disabled:opacity-50" style={{ background: '#3F6B52', color: '#F1F0EA' }}>
                  {saving ? 'Saving…' : `Confirm and add ${parsed.length} rows`}
                </button>
              ) : (
                <div className="mt-3 text-sm font-sans px-3 py-2 rounded" style={{ background: 'rgba(63,107,82,0.12)', color: '#3F6B52' }}>
                  {'\u2713'} Added. Close this panel to see the ledger update.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProgramLedger() {
  const [activeLocs, setActiveLocs] = useState(["Savannah", "Atlanta", "SCADnow"]);
  const [degreeFilter, setDegreeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("flagCount");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(null);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [legacyKeys, setLegacyKeys] = useState(new Set());
  const [lineage, setLineage] = useState([]);
  const [foundingOverrides, setFoundingOverrides] = useState([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mainView, setMainView] = useState('ledger');
  const [rawEnrollment, setRawEnrollment] = useState([]);
  const [rawGraduation, setRawGraduation] = useState([]);
  const [rawEmployment, setRawEmployment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  const LOCATIONS = ["Overall", "Savannah", "Atlanta", "SCADnow"];

  useEffect(() => {
    if (!supabaseEnabled) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [enrRes, gradRes, empRes, retRes, linkRes, foundRes] = await Promise.all([
        fetchAllRows(supabase.from('enrollment').select('location,program,degree,period,period_sort,count')),
        fetchAllRows(supabase.from('graduation').select('location,program,degree,year,count')),
        fetchAllRows(supabase.from('employment').select('location,program,degree,year,unrelated,creative,total')),
        supabase.from('retirements').select('key'),
        supabase.from('lineage_links').select('*'),
        supabase.from('founding_overrides').select('*'),
      ]);
      if (cancelled) return;
      const firstErr = enrRes.error || gradRes.error || empRes.error || retRes.error || linkRes.error || foundRes.error;
      if (firstErr) { setLoadError(firstErr.message); setLoading(false); return; }
      setRawEnrollment(enrRes.data);
      setRawGraduation(gradRes.data);
      setRawEmployment(empRes.data);
      setLegacyKeys(new Set(retRes.data.map(r => r.key)));
      setLineage(linkRes.data.map(l => ({ id: l.id, fromKey: l.from_key, toKey: l.to_key, fromLabel: l.from_label, toLabel: l.to_label, note: l.note })));
      setFoundingOverrides(foundRes.data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reloadTick]);

  // Apply lineage at the RAW ROW level, then derive everything from the merged history
  const { enrollmentRows, graduationRows, employmentRows, predecessorMap } = useMemo(
    () => applyLineageToRawRows(rawEnrollment, rawGraduation, rawEmployment, lineage),
    [rawEnrollment, rawGraduation, rawEmployment, lineage]
  );

  const allDerived = useMemo(() => {
    const derived = computeDerivedRows({ enrollmentRows, graduationRows, employmentRows, foundingOverrides });
    // Attach predecessor labels for display, and synthesize "Overall" as a live sum across the three campuses
    const withPredecessors = derived.map(r => ({ ...r, predecessors: predecessorMap.get(rowKeyOf(r.location, r.program, r.degree)) || [] }));

    // Build Overall by summing raw rows across all three locations first, then deriving — same
    // technique as lineage, so Overall's founding dates/averages are correct, not just added-up averages.
    const overallEnr = enrollmentRows.map(r => ({ ...r, location: 'Overall' }));
    const overallGrad = graduationRows.map(r => ({ ...r, location: 'Overall' }));
    const overallEmp = employmentRows.map(r => ({ ...r, location: 'Overall' }));
    const overallDerived = computeDerivedRows({ enrollmentRows: overallEnr, graduationRows: overallGrad, employmentRows: overallEmp, foundingOverrides })
      .map(r => ({ ...r, predecessors: [] }));

    return [...withPredecessors, ...overallDerived];
  }, [enrollmentRows, graduationRows, employmentRows, foundingOverrides, predecessorMap]);

  const allDegrees = useMemo(() => {
    const s = new Set(allDerived.map(r => r.degree));
    return ["All", ...Array.from(s).sort()];
  }, [allDerived]);

  const filteredBase = useMemo(() => {
    return allDerived.filter(r =>
      activeLocs.includes(r.location) &&
      (degreeFilter === "All" || r.degree === degreeFilter) &&
      (search.trim() === "" || r.program.toLowerCase().includes(search.trim().toLowerCase()))
    );
  }, [allDerived, activeLocs, degreeFilter, search]);

  const flagged = useMemo(() => computeFlags(filteredBase, legacyKeys), [filteredBase, legacyKeys]);

  const rows = useMemo(() => {
    let r = flagged;
    if (onlyFlagged) r = r.filter(x => x.redFlagged || x.yellowFlagged);
    const dir = sortDir === "asc" ? 1 : -1;
    return [...r].sort((a, b) => {
      if (sortKey === "flagCount") return ((a.concernCount - b.concernCount) * 1000 + (a.flags.length - b.flags.length)) * dir;
      if (sortKey === "program") return a.program.localeCompare(b.program) * dir;
      if (sortKey === "enrAvg") return ((a.enrAvgVal ?? -1) - (b.enrAvgVal ?? -1)) * dir;
      if (sortKey === "gradAvg") return ((a.gradAvgVal ?? -1) - (b.gradAvgVal ?? -1)) * dir;
      if (sortKey === "empAvg") return ((a.empAvgVal ?? -1) - (b.empAvgVal ?? -1)) * dir;
      return 0;
    });
  }, [flagged, sortKey, sortDir, onlyFlagged]);

  const stats = useMemo(() => {
    const total = flagged.length;
    const redCount = flagged.filter(r => r.redFlagged).length;
    const yellowCount = flagged.filter(r => r.yellowFlagged).length;
    const active = flagged.filter(r => !r.isRetired);
    const cohortCreative = active.reduce((sum, r) => sum + (r.empWindowCreative || 0), 0);
    const cohortTotal = active.reduce((sum, r) => sum + (r.empWindowTotal || 0), 0);
    const universityEmpAvg = cohortTotal > 0 ? cohortCreative / cohortTotal : null;
    return { total, redCount, yellowCount, universityEmpAvg };
  }, [flagged]);

  const winterWindowLabel = filteredBase[0]?.enrWindowPeriods?.length
    ? `${filteredBase[0].enrWindowPeriods[0]}–${filteredBase[0].enrWindowPeriods[filteredBase[0].enrWindowPeriods.length - 1]}`
    : '';
  const cohortLabel = `${activeLocs.length === 3 && !activeLocs.includes('Overall') ? 'all locations' : activeLocs.join(', ')}${degreeFilter !== 'All' ? ', ' + degreeFilter + ' only' : ''} (${filteredBase.length} programs)`;

  function toggleLoc(loc) {
    setActiveLocs(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  }
  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center font-sans" style={{ background: '#EEF1EC', color: '#1B2A41' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'); .font-serif{font-family:'Fraunces',serif;} .font-sans{font-family:'Public Sans',sans-serif;} .font-mono{font-family:'IBM Plex Mono',monospace;}`}</style>
        <div className="font-serif text-xl">Loading ledger data…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full font-sans" style={{ background: '#EEF1EC' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-serif { font-family: 'Fraunces', serif; }
        .font-sans { font-family: 'Public Sans', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #A98F62; border-radius: 4px; }
      `}</style>

      <aside className="w-72 shrink-0 p-6 flex flex-col gap-7" style={{ background: '#1B2A41' }}>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1" style={{ color: '#7C9885' }}>SCAD &middot; Curriculum &amp; Assessment</div>
          <h1 className="font-serif text-2xl leading-tight" style={{ color: '#F1F0EA' }}>Program Ledger</h1>
          <p className="text-xs font-sans mt-2 leading-relaxed" style={{ color: '#A9B7C8' }}>
            Enrollment and graduation health, computed live from whatever's in the database. Current Winter window: {winterWindowLabel || 'n/a'}.
          </p>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#7C9885' }}>Location</div>
          <div className="flex flex-col gap-1.5">
            {LOCATIONS.map(loc => (
              <button key={loc} onClick={() => toggleLoc(loc)} className="text-left px-3 py-2 rounded text-sm font-sans transition-colors"
                style={{
                  background: activeLocs.includes(loc) ? (loc === 'Overall' ? '#7C5B8A' : '#3F6B52') : 'transparent',
                  color: activeLocs.includes(loc) ? '#F1F0EA' : '#7A8699',
                  border: '1px solid ' + (activeLocs.includes(loc) ? (loc === 'Overall' ? '#7C5B8A' : '#3F6B52') : '#33425C'),
                }}>
                {loc}{loc === 'Overall' ? ' (all campuses combined)' : ''}
              </button>
            ))}
          </div>
          {activeLocs.includes('Overall') && activeLocs.length > 1 && (
            <div className="text-[10px] font-sans mt-2 leading-snug" style={{ color: '#C9A96E' }}>
              Heads up: Overall is a live sum across campuses. Combining it with individual campuses will double-count programs in the stats above.
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#7C9885' }}>Degree</div>
          <select value={degreeFilter} onChange={e => setDegreeFilter(e.target.value)} className="w-full text-sm font-sans px-3 py-2 rounded outline-none" style={{ background: '#233450', color: '#F1F0EA', border: '1px solid #33425C' }}>
            {allDegrees.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#7C9885' }}>Search program</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. Illustration" className="w-full text-sm font-sans px-3 py-2 rounded outline-none placeholder:text-stone-500" style={{ background: '#233450', color: '#F1F0EA', border: '1px solid #33425C' }} />
        </div>

        <label className="flex items-center gap-2 text-sm font-sans cursor-pointer" style={{ color: '#F1F0EA' }}>
          <input type="checkbox" checked={onlyFlagged} onChange={e => setOnlyFlagged(e.target.checked)} />
          Show flagged only
        </label>

        <button onClick={() => setUploadOpen(true)} className="text-sm font-sans px-3 py-2 rounded text-left" style={{ background: '#3F6B52', color: '#F1F0EA' }}>
          + Add new data
        </button>

        <div className="mt-auto pt-5 border-t text-[11px] font-sans leading-relaxed" style={{ borderColor: '#33425C', color: '#7A8699' }}>
          <div className="font-mono uppercase tracking-widest mb-1" style={{ color: '#7C9885' }}>How flags work</div>
          A program earns a concern when its 5-yr average enrollment or graduate count is &le;10, falls in the bottom 10% of whatever's currently in view, or its field-related employment rate is below the university-wide average — three possible axes: enrollment, graduation, employment. <span style={{ color: '#B8462F', fontWeight: 600 }}>Red</span> means 2 or 3 of those are true; <span style={{ color: '#B8860B', fontWeight: 600 }}>yellow</span> means exactly 1. All three windows roll forward automatically as new data is added.
          <br /><br />
          The purple <span style={{ color: '#7C5B8A', fontWeight: 600 }}>completion</span> badge is a different signal: enrollment holding steady or rising while graduation is falling — worth a look regardless of red/yellow status.
          <br /><br />
          Degree types with {SMALL_COHORT_THRESHOLD} or fewer programs in view get a <span style={{ fontFamily: 'IBM Plex Mono' }}>small n=</span> badge instead of an equally-confident percentile flag.
          <br /><br />
          Founding dates are inferred from each program's earliest enrollment record, unless manually overridden in "Manage the ledger."
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {loadError && (
          <div className="mb-4 text-sm font-sans px-3 py-2 rounded" style={{ background: 'rgba(184,70,47,0.1)', color: '#B8462F' }}>
            Couldn't load data from Supabase: {loadError}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Programs in view', value: stats.total, color: '#1B2A41' },
            { label: 'Flagged \u2014 red (2-3 issues)', value: stats.redCount, color: '#B8462F' },
            { label: 'Flagged \u2014 yellow (1 issue)', value: stats.yellowCount, color: '#B8860B' },
            { label: 'University employment avg', value: stats.universityEmpAvg !== null ? `${(stats.universityEmpAvg * 100).toFixed(0)}%` : '\u2014', color: '#3F6B52' },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: '#F8F7F2', border: '1px solid #DDD7C8' }}>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#8A8F86' }}>{s.label}</div>
              <div className="font-serif text-4xl font-semibold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-center gap-1">
            {[{ id: 'ledger', label: 'Ledger' }, { id: 'compare', label: 'Compare Locations' }].map(t => (
              <button key={t.id} onClick={() => setMainView(t.id)}
                className="font-serif text-xl px-1 pb-1"
                style={{ color: mainView === t.id ? '#1B2A41' : '#B0AA9C', borderBottom: mainView === t.id ? '2px solid #1B2A41' : '2px solid transparent' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono" style={{ color: '#8A8F86' }}>cohort: {cohortLabel}</div>
            <button onClick={() => setManageOpen(true)} className="text-xs font-sans px-3 py-1.5 rounded" style={{ background: '#1B2A41', color: '#F1F0EA' }}>
              Manage the ledger
            </button>
          </div>
        </div>

        {mainView === 'compare' ? (
          <CompareLocationsView rows={rows} onSelect={setSelected} />
        ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #DDD7C8', background: '#F8F7F2' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#1B2A41' }}>
                <th onClick={() => toggleSort('program')} className="text-left px-4 py-3 font-sans font-medium cursor-pointer select-none" style={{ color: '#F1F0EA' }}>Program {sortKey === 'program' && (sortDir === 'asc' ? '\u2191' : '\u2193')}</th>
                <th className="text-left px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Degree</th>
                <th className="text-left px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Location</th>
                <th className="text-left px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Enrollment (Winter window)</th>
                <th onClick={() => toggleSort('enrAvg')} className="text-right px-3 py-3 font-sans font-medium cursor-pointer select-none" style={{ color: '#F1F0EA' }}>5-Yr Avg {sortKey === 'enrAvg' && (sortDir === 'asc' ? '\u2191' : '\u2193')}</th>
                <th className="text-left px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Graduates (5-yr window)</th>
                <th onClick={() => toggleSort('gradAvg')} className="text-right px-3 py-3 font-sans font-medium cursor-pointer select-none" style={{ color: '#F1F0EA' }}>5-Yr Avg {sortKey === 'gradAvg' && (sortDir === 'asc' ? '\u2191' : '\u2193')}</th>
                <th className="text-left px-3 py-3 font-sans font-medium" style={{ color: '#F1F0EA' }}>Employment (field-related)</th>
                <th onClick={() => toggleSort('empAvg')} className="text-right px-3 py-3 font-sans font-medium cursor-pointer select-none" style={{ color: '#F1F0EA' }}>5-Yr Avg {sortKey === 'empAvg' && (sortDir === 'asc' ? '\u2191' : '\u2193')}</th>
                <th onClick={() => toggleSort('flagCount')} className="text-center px-4 py-3 font-sans font-medium cursor-pointer select-none" style={{ color: '#F1F0EA' }}>Status {sortKey === 'flagCount' && (sortDir === 'asc' ? '\u2191' : '\u2193')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const ft = foundingText(r);
                return (
                  <tr key={r.location + r.program + r.degree} onClick={() => setSelected(r)} className="cursor-pointer transition-colors hover:bg-black/[0.03]" style={{ borderTop: i === 0 ? 'none' : '1px solid #E5E0D3' }}>
                    <td className="px-4 py-3">
                      <div className="font-serif" style={{ color: '#1B2A41' }}>{r.program}</div>
                      <div className="font-mono text-[10px] mt-0.5" style={{ color: r.founded ? (r.foundedOverridden ? '#3F6B52' : '#8A8F86') : '#B8AFA0' }} title={ft.full}>{ft.short}{r.foundedOverridden ? ' \u270e' : ''}</div>
                      {r.predecessors && r.predecessors.length > 0 && (
                        <div className="text-[10px] font-sans mt-0.5 italic" style={{ color: '#7C9885' }} title={r.predecessors.map(p => `${p.label}${p.note ? ' \u2014 ' + p.note : ''}`).join('; ')}>
                          formerly {r.predecessors.map(p => p.label.split(' — ')[0]).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs" style={{ color: '#5A5A54' }}>{r.degree}</td>
                    <td className="px-3 py-3 font-sans text-xs" style={{ color: '#5A5A54' }}>{r.location}</td>
                    <td className="px-3 py-3"><div className="flex items-center">{<Sparkline values={r.enrWindowVals} color="#3F6B52" />}<TrendArrow trend={r.enrTrend} /></div></td>
                    <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: '#1B2A41' }}>{r.enrAvgVal !== null ? r.enrAvgVal.toFixed(1) : '\u2014'}</td>
                    <td className="px-3 py-3"><div className="flex items-center">{<Sparkline values={r.gradDisplayVals?.slice(0, -1)} color="#1B2A41" />}<TrendArrow trend={r.gradTrend} /></div></td>
                    <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: '#1B2A41' }}>{r.gradAvgVal !== null ? r.gradAvgVal.toFixed(1) : '\u2014'}</td>
                    <td className="px-3 py-3"><div className="flex items-center">{<Sparkline values={r.empDisplayVals?.map(v => v === null ? 0 : v * 100)} color="#7C5B8A" />}<TrendArrow trend={r.empTrend} /></div></td>
                    <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: '#1B2A41' }}>{r.empAvgVal !== null ? `${(r.empAvgVal * 100).toFixed(0)}%` : '\u2014'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {r.isRetired ? <RetiredBadge /> : <FlagStamp severity={r.redFlagged ? 'red' : r.yellowFlagged ? 'yellow' : null} flags={r.flags} />}
                        {r.smallCohort && <SmallCohortBadge cohortSize={r.cohortSize} degree={r.degree} />}
                        {r.completionConcern && <CompletionBadge />}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 font-sans text-sm" style={{ color: '#8A8F86' }}>No programs match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        <div className="mt-4 text-[11px] font-sans" style={{ color: '#8A8F86' }}>
          {mainView === 'compare'
            ? 'Click any campus\'s numbers to open the full detail drawer for that program at that location.'
            : 'Click any row for the full trend and flag rationale. All numbers computed live from the enrollment and graduation tables in Supabase.'}
        </div>
      </main>

      <DetailDrawer row={selected} onClose={() => setSelected(null)} cohortLabel={cohortLabel} allRows={allDerived} />
      {manageOpen && (
        <ManagePanel raw={allDerived.filter(r => r.location !== 'Overall')} legacyKeys={legacyKeys} setLegacyKeys={setLegacyKeys}
          lineage={lineage} setLineage={setLineage} foundingOverrides={foundingOverrides} setFoundingOverrides={setFoundingOverrides}
          onClose={() => setManageOpen(false)} />
      )}
      {uploadOpen && (
        <UploadPanel onClose={() => setUploadOpen(false)} onImported={() => setReloadTick(t => t + 1)} />
      )}
    </div>
  );
}
