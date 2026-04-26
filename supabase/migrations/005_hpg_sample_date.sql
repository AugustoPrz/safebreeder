-- Migration 005 — store sampling date for HPG records.
-- Used to schedule a calendar reminder 27 days after sampling.

alter table public.hpg_records
  add column if not exists sample_date date;

create index if not exists hpg_records_sample_date_idx
  on public.hpg_records(sample_date)
  where sample_date is not null;
