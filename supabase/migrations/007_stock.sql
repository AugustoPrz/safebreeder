-- Migration 007 — stock (animal inventory) table.
-- Run in the Supabase SQL editor. One stock record per lot.

create table if not exists public.stock (
  lot_id uuid primary key references public.lots on delete cascade,
  rows jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.stock enable row level security;

drop policy if exists "stock via lot" on public.stock;
create policy "stock via lot" on public.stock
  for all
  using (
    exists (select 1 from public.lots l
            where l.id = stock.lot_id and l.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lots l
            where l.id = stock.lot_id and l.user_id = auth.uid())
  );
