-- Migration 004 — vaccines table.
-- Run in the Supabase SQL editor. One vaccine record per (lot, month).

create table if not exists public.vaccines (
  lot_id uuid not null references public.lots on delete cascade,
  month_key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (lot_id, month_key)
);

alter table public.vaccines enable row level security;

drop policy if exists "vaccines via lot" on public.vaccines;
create policy "vaccines via lot" on public.vaccines
  for all
  using (
    exists (select 1 from public.lots l
            where l.id = vaccines.lot_id and l.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lots l
            where l.id = vaccines.lot_id and l.user_id = auth.uid())
  );
