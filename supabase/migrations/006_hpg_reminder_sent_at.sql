-- Migration 006 — track which HPG records have already been notified.
-- Used by the daily reminder cron for idempotency.

alter table public.hpg_records
  add column if not exists reminder_sent_at timestamptz;

-- Partial index — only the rows that haven't been notified yet, which is what
-- the cron query filters on. Keeps the index tiny.
create index if not exists hpg_records_reminder_pending_idx
  on public.hpg_records(sample_date)
  where reminder_sent_at is null and sample_date is not null;
