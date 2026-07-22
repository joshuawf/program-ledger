// dataEngine.js
//
// Pure functions only — no React, no Supabase calls. Takes raw enrollment/
// graduation rows (one row per location+program+degree+period) plus any
// founding-date overrides, and derives everything the dashboard displays:
// rolling-window averages, flags, and founding dates. Nothing here is
// precomputed or hardcoded — every number recalculates from whatever rows
// are passed in, which is what lets the dashboard update itself when new
// data is uploaded.

const SEASON_ORDER = { Fall: 0, Winter: 1, Spring: 2, Summer: 3 };

// Mirrors the same academic-year convention used when the seed data was
// built: Fall starts an academic year; Winter/Spring/Summer belong to the
// *previous* Fall's academic year. This must stay consistent with however
// period_sort was computed when a row was written, uploaded or seeded.
export function periodSortKey(period) {
  const [season, yearStr] = period.trim().split(/\s+/);
  const year = parseInt(yearStr, 10);
  const academicYear = season === 'Fall' ? year : year - 1;
  return academicYear * 10 + (SEASON_ORDER[season] ?? 0);
}

function rowKeyOf(location, program, degree) {
  return `${location}|${program}|${degree}`;
}

function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  const idx = (p / 100) * (sortedAsc.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}

/**
 * Figure out which 5 Winter periods count as "current" for enrollment
 * averaging — the 5 most recent Winters present anywhere in the dataset.
 * Every program is measured against this same fixed set of 5 quarters,
 * so a program with no Winter 2022 data gets a 0 for that quarter rather
 * than being compared against a different window than everyone else.
 */
export function currentWinterWindow(enrollmentRows) {
  const winters = Array.from(
    new Set(enrollmentRows.filter(r => r.period.startsWith('Winter')).map(r => r.period))
  );
  winters.sort((a, b) => periodSortKey(b) - periodSortKey(a)); // newest first
  return winters.slice(0, 5).sort((a, b) => periodSortKey(a) - periodSortKey(b)); // oldest→newest for display
}

/**
 * Same idea for graduation: find every year present, treat the single
 * most recent year as "partial" (still accumulating graduates) and
 * excluded from the average, and use the 5 years before that as the
 * official window.
 */
export function currentGradWindow(graduationRows) {
  const years = Array.from(new Set(graduationRows.map(r => r.year))).sort((a, b) => a - b);
  if (years.length === 0) return { windowYears: [], partialYear: null, displayYears: [] };
  const partialYear = years[years.length - 1];
  const completeYears = years.filter(y => y !== partialYear);
  const windowYears = completeYears.slice(-5);
  const displayYears = [...windowYears, partialYear];
  return { windowYears, partialYear, displayYears };
}

/**
 * Employment years are all treated as complete — unlike graduation, there's no
 * "still accumulating" concern once a year's survey results are released.
 * Uses the 5 most recent years present, with no partial-year exclusion.
 */
export function currentEmploymentWindow(employmentRows) {
  const years = Array.from(new Set(employmentRows.map(r => r.year))).sort((a, b) => a - b);
  if (years.length === 0) return { windowYears: [], partialYear: null, displayYears: [] };
  const windowYears = years.slice(-5);
  return { windowYears, partialYear: null, displayYears: windowYears };
}

/**
 * The earliest period in the whole dataset — used to phrase "Pre-<year>"
 * for any program whose first on-record enrollment coincides with the
 * very start of the data, meaning we genuinely can't see further back.
 */
export function globalEarliestPeriod(enrollmentRows) {
  if (enrollmentRows.length === 0) return null;
  let earliest = enrollmentRows[0];
  for (const r of enrollmentRows) {
    if (periodSortKey(r.period) < periodSortKey(earliest.period)) earliest = r;
  }
  return earliest.period;
}

/**
 * Build one derived row per location/program/degree, combining enrollment
 * and graduation history, rolling-window averages, and founding dates.
 * This is the single function the dashboard calls to go from "raw rows in
 * the database" to "everything shown on the ledger."
 */
export function computeDerivedRows({ enrollmentRows, graduationRows, employmentRows = [], foundingOverrides }) {
  const winterWindow = currentWinterWindow(enrollmentRows);
  const winterWindowSet = new Set(winterWindow);
  const { windowYears, partialYear, displayYears } = currentGradWindow(graduationRows);
  const { windowYears: empWindowYears, partialYear: empPartialYear, displayYears: empDisplayYears } = currentEmploymentWindow(employmentRows);
  const globalEarliest = globalEarliestPeriod(enrollmentRows);
  const globalEarliestSort = globalEarliest ? periodSortKey(globalEarliest) : null;
  const globalEarliestYear = globalEarliest ? globalEarliest.split(/\s+/)[1] : null;

  const overrideMap = new Map(foundingOverrides.map(o => [o.key, o]));

  // Group raw rows by location/program/degree
  const groups = new Map();
  function getGroup(location, program, degree) {
    const key = rowKeyOf(location, program, degree);
    if (!groups.has(key)) {
      groups.set(key, { location, program, degree, enrollment: [], graduation: [], employment: [] });
    }
    return groups.get(key);
  }
  for (const r of enrollmentRows) getGroup(r.location, r.program, r.degree).enrollment.push(r);
  for (const r of graduationRows) getGroup(r.location, r.program, r.degree).graduation.push(r);
  for (const r of employmentRows) getGroup(r.location, r.program, r.degree).employment.push(r);

  const derived = [];
  for (const g of groups.values()) {
    const key = rowKeyOf(g.location, g.program, g.degree);

    // Enrollment: pull counts for the fixed 5-Winter window, 0 if absent
    const enrByPeriod = {};
    for (const r of g.enrollment) enrByPeriod[r.period] = (enrByPeriod[r.period] || 0) + r.count;
    const hasAnyEnrollment = g.enrollment.length > 0;
    const enrWindowVals = winterWindow.map(p => enrByPeriod[p] || 0);
    const enrWindowAvg = hasAnyEnrollment ? enrWindowVals.reduce((a, b) => a + b, 0) / (winterWindow.length || 1) : null;

    // Graduation: pull counts for the complete-years window + partial year for display
    const gradByYear = {};
    for (const r of g.graduation) gradByYear[r.year] = (gradByYear[r.year] || 0) + r.count;
    const hasAnyGraduation = g.graduation.length > 0;
    const gradDisplayVals = displayYears.map(y => gradByYear[y] || 0);
    const gradWindowAvg = hasAnyGraduation && windowYears.length > 0
      ? windowYears.reduce((sum, y) => sum + (gradByYear[y] || 0), 0) / windowYears.length
      : null;

    // Employment: weighted average (sum of creative / sum of total across the window),
    // NOT an average of yearly percentages — a rate should be weighted by how many
    // graduates it's based on, so one big confident year isn't diluted by a tiny
    // low-n year the same as if they carried equal weight. Years with zero total
    // (no graduates to survey) are skipped entirely rather than counted as 0%.
    const empByYear = {};
    for (const r of g.employment) {
      const e = empByYear[r.year] || { creative: 0, total: 0 };
      e.creative += r.creative;
      e.total += r.total;
      empByYear[r.year] = e;
    }
    const hasAnyEmployment = g.employment.length > 0;
    const empDisplayVals = empDisplayYears.map(y => {
      const e = empByYear[y];
      return e && e.total > 0 ? e.creative / e.total : null;
    });
    let empWindowCreative = 0, empWindowTotal = 0;
    for (const y of empWindowYears) {
      const e = empByYear[y];
      if (e && e.total > 0) { empWindowCreative += e.creative; empWindowTotal += e.total; }
    }
    const empAvgVal = empWindowTotal > 0 ? empWindowCreative / empWindowTotal : null;

    let founded = null;
    if (hasAnyEnrollment) {
      let earliestRow = null;
      for (const r of g.enrollment) {
        if (r.count > 0 && (!earliestRow || periodSortKey(r.period) < periodSortKey(earliestRow.period))) {
          earliestRow = r;
        }
      }
      if (earliestRow) {
        founded = periodSortKey(earliestRow.period) <= globalEarliestSort
          ? `Pre-${globalEarliestYear}`
          : earliestRow.period;
      }
    }
    const override = overrideMap.get(key);
    const foundedOverridden = Boolean(override);
    if (override) founded = override.founded_label;

    derived.push({
      location: g.location, program: g.program, degree: g.degree,
      enrWindowPeriods: winterWindow, enrWindowVals, enrAvgVal: enrWindowAvg,
      enrTrend: hasAnyEnrollment ? computeTrend(enrWindowVals) : null,
      gradDisplayYears: displayYears, gradDisplayVals: gradDisplayVals, gradPartialYear: partialYear,
      gradAvgVal: gradWindowAvg,
      // Trend uses only the complete-years window, same as the average — the
      // partial final year is excluded so an in-progress year doesn't read as a drop.
      gradTrend: hasAnyGraduation ? computeTrend(windowYears.map(y => gradByYear[y] || 0)) : null,
      empDisplayYears, empDisplayVals, empPartialYear, empAvgVal,
      empTrend: hasAnyEmployment ? computeTrend(empWindowYears.map(y => {
        const e = empByYear[y];
        return e && e.total > 0 ? e.creative / e.total : null;
      }).filter(v => v !== null)) : null,
      empWindowCreative, empWindowTotal, hasAnyEmployment,
      founded, foundedOverridden, foundedNote: override?.note || null,
    });
  }

  return derived;
}

/**
 * Compare the first half of a window to the second half to get a simple
 * rising/falling/flat read. Deliberately coarse — this is meant to catch
 * "this has clearly been sliding for a while," not to be a precise
 * statistical trend line. A >15% shift between halves counts as a real
 * direction; anything smaller reads as flat/noise.
 */
export function computeTrend(values) {
  const real = values.filter(v => v !== undefined && v !== null);
  if (real.length < 2) return null;
  const mid = Math.ceil(real.length / 2);
  const firstHalf = real.slice(0, mid);
  const secondHalf = real.slice(real.length - mid);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  if (firstAvg === 0 && secondAvg === 0) return 'flat';
  if (firstAvg === 0) return 'rising'; // went from nothing to something
  const change = (secondAvg - firstAvg) / firstAvg;
  if (change > 0.15) return 'rising';
  if (change < -0.15) return 'falling';
  return 'flat';
}


/**
 * Compute flags (≤10, bottom-10%, small-cohort) for a set of derived rows.
 * Takes the same cohort every time it's called — pass in whatever subset
 * is currently filtered/visible, and thresholds recompute against exactly
 * that subset, live.
 */
export function computeFlags(rows, legacyKeys) {
  const activeRows = rows.filter(r => !legacyKeys.has(`${r.location}|${r.program}|${r.degree}`));
  const enrVals = activeRows.map(r => r.enrAvgVal).filter(v => v !== null && v > 0).sort((a, b) => a - b);
  const gradVals = activeRows.map(r => r.gradAvgVal).filter(v => v !== null && v > 0).sort((a, b) => a - b);
  const enrP10 = percentile(enrVals, 10);
  const gradP10 = percentile(gradVals, 10);

  // University-wide employment benchmark: weighted the same way as each program's
  // own average (sum of creative-field placements / sum of total, across every
  // active program currently in view) — not a plain average of each program's
  // rate, which would let a tiny program's rate count as much as a huge one's.
  const cohortCreative = activeRows.reduce((sum, r) => sum + (r.empWindowCreative || 0), 0);
  const cohortTotal = activeRows.reduce((sum, r) => sum + (r.empWindowTotal || 0), 0);
  const universityEmpAvg = cohortTotal > 0 ? cohortCreative / cohortTotal : null;

  const degreeCounts = {};
  activeRows.forEach(r => { degreeCounts[r.degree] = (degreeCounts[r.degree] || 0) + 1; });

  return rows.map(r => {
    const key = `${r.location}|${r.program}|${r.degree}`;
    const isRetired = legacyKeys.has(key);
    const flags = [];
    if (!isRetired) {
      if (r.enrAvgVal !== null && r.enrAvgVal > 0) {
        if (r.enrAvgVal <= 10) flags.push({ code: 'E10', label: '≤10 avg enrolled/qtr' });
        if (r.enrAvgVal <= enrP10) flags.push({ code: 'EP10', label: 'bottom 10% enrollment' });
      }
      if (r.gradAvgVal !== null && r.gradAvgVal > 0) {
        if (r.gradAvgVal <= 10) flags.push({ code: 'G10', label: '≤10 avg graduates/yr' });
        if (r.gradAvgVal <= gradP10) flags.push({ code: 'GP10', label: 'bottom 10% graduation' });
      }
      if (r.empAvgVal !== null && universityEmpAvg !== null && r.empAvgVal < universityEmpAvg) {
        flags.push({ code: 'EMP', label: `below university avg (${(r.empAvgVal * 100).toFixed(0)}% vs ${(universityEmpAvg * 100).toFixed(0)}%)` });
      }
    }
    const cohortSize = degreeCounts[r.degree] || 0;
    // Explicit checks, not prefix-matching — 'EMP' also starts with 'E', so
    // .startsWith('E') would wrongly count an employment flag as an enrollment one.
    const hasEnrFlag = flags.some(f => f.code === 'E10' || f.code === 'EP10');
    const hasGradFlag = flags.some(f => f.code === 'G10' || f.code === 'GP10');
    const hasEmpFlag = flags.some(f => f.code === 'EMP');
    // "Flagged" (the badge, the stat card, the "show flagged only" filter) now
    // requires all three — enrollment, graduation, AND employment all have to be
    // low for a program to earn the main flagged stamp. Being weak on just one
    // or two axes is worth knowing about, but isn't the same signal.
    const bothSidesFlagged = hasEnrFlag && hasGradFlag && hasEmpFlag;

    // Completion concern: enrollment isn't shrinking, but graduation is — a different
    // kind of problem than "this program is just small." Note the honest limit here:
    // this is a trend comparison, not true cohort-tracked yield — the data has no
    // student IDs, so there's no way to follow an actual enrolled cohort through to
    // its actual graduation. This is the closest approximation available.
    const completionConcern = !isRetired
      && r.enrAvgVal !== null && r.enrAvgVal > 0
      && r.gradAvgVal !== null
      && r.enrTrend !== 'falling'
      && r.gradTrend === 'falling';

    return { ...r, flags, isRetired, cohortSize, hasEnrFlag, hasGradFlag, hasEmpFlag, bothSidesFlagged, completionConcern };
  });
}
