-- Program Ledger v2 — full schema
-- Run this in Supabase: Project → SQL Editor → New query → paste → Run
-- (If you already have the v1 tables — retirements, lineage_links — this is
-- safe to run again; it only creates what doesn't already exist.)

-- ── Raw data tables ──────────────────────────────────────────────────────
-- One row per program/degree/location/period. This is the source of truth —
-- the dashboard computes every average, flag, and founding date live from
-- whatever's in these two tables. No precomputed numbers are stored anywhere.

create table if not exists enrollment (
  id bigint generated always as identity primary key,
  location text not null,
  program text not null,
  degree text not null,
  period text not null,        -- e.g. "Winter 2013"
  period_sort integer not null, -- e.g. 20131 — sortable stand-in for the period, see README
  count integer not null,
  created_at timestamptz default now()
);

create table if not exists graduation (
  id bigint generated always as identity primary key,
  location text not null,
  program text not null,
  degree text not null,
  year integer not null,
  count integer not null,
  created_at timestamptz default now()
);

create index if not exists enrollment_lookup on enrollment (location, program, degree);
create index if not exists graduation_lookup on graduation (location, program, degree);

-- ── Manual founding-date overrides ───────────────────────────────────────
-- The dashboard infers a program's founding quarter from its earliest
-- non-zero enrollment record. If that inference is wrong for a specific
-- program (e.g. the real launch date is documented somewhere and disagrees
-- with the data), an override here always wins over the inferred value.
create table if not exists founding_overrides (
  key text primary key,   -- "location|program|degree", matching the ledger's row key
  founded_label text not null,  -- whatever you want shown, e.g. "Fall 2016" or "Pre-2010"
  note text,
  created_at timestamptz default now()
);

-- ── Retirements & lineage (unchanged from v1, included here for a fresh setup) ──
create table if not exists retirements (
  key text primary key,
  created_at timestamptz default now()
);

create table if not exists lineage_links (
  id bigint generated always as identity primary key,
  from_key text not null,
  to_key text not null,
  from_label text,
  to_label text,
  note text,
  created_at timestamptz default now()
);

-- ── Row Level Security ───────────────────────────────────────────────────
-- Same open read/write policy as v1 — no login system on this dashboard, so
-- anyone with the link can view and edit. Fine for a small internal tool
-- with non-sensitive data; see README if you ever want to lock this down.
alter table enrollment enable row level security;
alter table graduation enable row level security;
alter table founding_overrides enable row level security;
alter table retirements enable row level security;
alter table lineage_links enable row level security;

create policy "public all enrollment" on enrollment for all using (true) with check (true);
create policy "public all graduation" on graduation for all using (true) with check (true);
create policy "public all founding_overrides" on founding_overrides for all using (true) with check (true);
create policy "public all retirements" on retirements for all using (true) with check (true);
create policy "public all lineage_links" on lineage_links for all using (true) with check (true);
