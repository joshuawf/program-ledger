# Program Ledger

An interactive dashboard tracking enrollment and graduation health across SCAD's degree programs — built with React + Vite + Tailwind, backed by Supabase.

**This version computes everything live.** Enrollment and graduation numbers live in a database (Supabase), not hardcoded in the app. Averages, percentile flags, and founding dates are all calculated fresh every time the data changes — including automatically rolling the "current" 5-year window forward as new years of data are added.

## Requires Supabase (this version doesn't work without it)

Unlike earlier versions of this dashboard, there's no fallback "browser memory only" mode for the actual enrollment/graduation data — it has to come from somewhere, and that somewhere is Supabase. See **Setting up Supabase** below; it's required before this will show anything.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`). You'll need a `.env.local` file with your Supabase credentials first (see below).

## Setting up Supabase

1. Create a free account at [supabase.com](https://supabase.com) and a new project.
2. Go to **SQL Editor → New query**, paste in the entire contents of `supabase-setup-v2.sql` (included in this repo), and click **Run**. This creates all five tables the dashboard needs: `enrollment`, `graduation`, `founding_overrides`, `retirements`, `lineage_links`.
3. Go to **Settings → API Keys**. Copy the **Project URL**, and the **Publishable key** (starts with `sb_publishable_...` — on older projects, this may be called the **anon** key under a "Legacy" tab instead; either works).
4. **For local development:** copy `.env.local.example` to `.env.local` and paste your URL/key in.
5. **For the deployed GitHub Pages site:** repo → **Settings → Secrets and variables → Actions**, add two repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Then re-run the deploy workflow (Actions tab → Run workflow), or push any small change to trigger it.

## Loading the seed data

Two CSV files are included: `seed_enrollment.csv` and `seed_graduation.csv`. To load them into your fresh Supabase project:

1. In Supabase, go to **Table Editor** → click the `enrollment` table
2. Click **Insert** → **Import data from CSV**
3. Upload `seed_enrollment.csv`, confirm the column mapping looks right, import
4. Repeat for the `graduation` table with `seed_graduation.csv`

That's your full history loaded — the dashboard will compute everything from there.

## Adding new years of data going forward

Once it's running, there's an **"+ Add new data"** button in the dashboard sidebar. It accepts a CSV in the same tidy format as the seed files:

- **Enrollment CSV columns:** `location, program, degree, period, period_sort, count`
- **Graduation CSV columns:** `location, program, degree, year, count`

It shows you a preview (row count, total students, which programs are affected) before you confirm — nothing is saved until you click confirm. This is an *additive* upload: it adds new rows, it doesn't overwrite or delete anything, so don't upload the same period twice or counts will double up.

### About `period_sort`

Each enrollment row needs a `period_sort` value so the dashboard can tell chronological order (Fall 2010 comes before Winter 2011, etc.). The formula:

- `academic_year` = the calendar year printed, **except** for Winter/Spring/Summer terms, which belong to the *previous* Fall's academic year (so "Winter 2013" has `academic_year = 2012`, matching "Fall 2012")
- `period_sort` = `academic_year * 10 + season_number`, where Fall=0, Winter=1, Spring=2, Summer=3

Example: "Fall 2026" → `20260`. "Winter 2027" → `20261`. If you're only ever adding one new Winter quarter a year going forward, the pattern is easy to continue — ask if you want me to just compute it for you each time instead.

## Manual founding-date overrides

The dashboard infers each program's founding date from its earliest enrollment record. If you know the real launch date and it disagrees (or a program's early years are missing from the data), open **"Manage the ledger" → Founding dates** and set it directly — your value always wins over the inferred one.

## Retirements & program lineage

Also in **"Manage the ledger"**:
- **Retirements** — mark a program as retired/legacy; it stays visible but drops out of every flag and percentile calculation.
- **Rename / merge** — if Program A became Program B, link them here. Their full enrollment and graduation history combines under B automatically, and B's founding date recalculates from the *combined* history (not just copied from A) — so this is more accurate than a simple "add the two averages together."

## Project structure

```
├── index.html                Vite entry HTML
├── src/
│   ├── main.jsx               Mounts the React app
│   ├── ProgramLedger.jsx      The dashboard component (UI + Supabase wiring)
│   ├── dataEngine.js          Pure calculation functions — rolling windows,
│   │                          founding dates, flags. No React, no Supabase;
│   │                          easy to test in isolation.
│   ├── supabaseClient.js      Supabase client setup
│   └── index.css              Tailwind directives
├── supabase-setup-v2.sql     Full schema (5 tables + RLS policies)
├── seed_enrollment.csv       Full enrollment history, Fall 2010–Winter 2026
├── seed_graduation.csv       Full graduation history, 2021–2026
├── vite.config.js            Uses a relative base path — works at any Pages URL
├── tailwind.config.js
├── postcss.config.js
└── .github/workflows/deploy.yml   Build + deploy automation
```

## Known limitations

- **"Overall" is computed by summing raw rows across the three campuses live**, then deriving from that combined history — so it's always accurate, but it does mean a lot of the same computation runs twice (once per campus, once for Overall). Fine at this data size; would need optimizing if the dataset grew dramatically.
- **The upload feature is purely additive** — there's no "replace" or "delete a period" button yet. If you upload bad data, the cleanest fix right now is deleting the bad rows directly in Supabase's Table Editor (filter by `period` or `year`, select, delete).
- **No login system** — anyone with the dashboard's link can retire programs, add lineage links, or upload data. Fine for a small internal tool; would need real access control for anything more sensitive.
