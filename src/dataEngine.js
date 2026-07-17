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
export function computeDerivedRows({ enrollmentRows, graduationRows, foundingOverrides }) {
  const winterWindow = currentWinterWindow(enrollmentRows);
  const winterWindowSet = new Set(winterWindow);
  const { windowYears, partialYear, displayYears } = currentGradWindow(graduationRows);
  const globalEarliest = globalEarliestPeriod(enrollmentRows);
  const globalEarliestSort = globalEarliest ? periodSortKey(globalEarliest) : null;
  const globalEarliestYear = globalEarliest ? globalEarliest.split(/\s+/)[1] : null;

  const overrideMap = new Map(foundingOverrides.map(o => [o.key, o]));

  // Group raw rows by location/program/degree
  const groups = new Map();
  function getGroup(location, program, degree) {
    const key = rowKeyOf(location, program, degree);
    if (!groups.has(key)) {
      groups.set(key, { location, program, degree, enrollment: [], graduation: [] });
    }
    return groups.get(key);
  }
  for (const r of enrollmentRows) getGroup(r.location, r.program, r.degree).enrollment.push(r);
  for (const r of graduationRows) getGroup(r.location, r.program, r.degree).graduation.push(r);

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

    // Founding date: earliest period (any season, full history) with count > 0
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
      gradDisplayYears: displayYears, gradDisplayVals: gradDisplayVals, gradPartialYear: partialYear,
      gradAvgVal: gradWindowAvg,
      founded, foundedOverridden, foundedNote: override?.note || null,
    });
  }

  return derived;
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
    }
    const cohortSize = degreeCounts[r.degree] || 0;
    const hasEnrFlag = flags.some(f => f.code.startsWith('E'));
    const hasGradFlag = flags.some(f => f.code.startsWith('G'));
    // "Flagged" (the badge, the stat card, the "show flagged only" filter) now means
    // low on BOTH sides — a program that's merely small on one axis isn't interesting
    // on its own; it's the combination that signals a program worth a closer look.
    const bothSidesFlagged = hasEnrFlag && hasGradFlag;
    return { ...r, flags, isRetired, cohortSize, hasEnrFlag, hasGradFlag, bothSidesFlagged };
  });
}
