-- Run this once in Supabase: Project → SQL Editor → New query → paste this → Run

-- Table 1: programs marked "retired" — excluded from flag thresholds
create table if not exists retirements (
  key text primary key,
  created_at timestamptz default now()
);

-- Table 2: rename/merge links between programs
create table if not exists lineage_links (
  id bigint generated always as identity primary key,
  from_key text not null,
  to_key text not null,
  from_label text,
  to_label text,
  note text,
  created_at timestamptz default now()
);

-- Row Level Security: required by Supabase before any table is reachable
-- from the browser. This dashboard has no login system — anyone with the
-- link can view and edit it — so these policies simply allow open read/write.
-- Fine for a small internal tool; if this ever needs real access control,
-- these policies are the place to add it.
alter table retirements enable row level security;
alter table lineage_links enable row level security;

create policy "public read retirements" on retirements
  for select using (true);
create policy "public write retirements" on retirements
  for insert with check (true);
create policy "public delete retirements" on retirements
  for delete using (true);

create policy "public read lineage_links" on lineage_links
  for select using (true);
create policy "public write lineage_links" on lineage_links
  for insert with check (true);
create policy "public delete lineage_links" on lineage_links
  for delete using (true);
