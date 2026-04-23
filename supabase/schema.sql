-- Safebreeder — initial schema
-- Run this in the Supabase SQL editor (as the project owner).

-- ============================================================
-- Profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  email text,
  role text check (role in ('veterinario','productor','asesor','administrador','otro')),
  plan text not null default 'trial' check (plan in ('trial','basic','pro','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed a profile row on signup so the app always finds one.
-- Picks up `name` from raw_user_meta_data (set by signUp({ options: { data: { name } } }))
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Establishments
-- ============================================================
create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  owner text,
  province text,
  province_id text,
  district text,
  district_id text,
  created_at timestamptz not null default now()
);
create index if not exists establishments_user_idx on public.establishments (user_id);

-- ============================================================
-- Lots
-- ============================================================
create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  establishment_id uuid not null references public.establishments on delete cascade,
  name text not null,
  category text not null,
  head_count int,
  created_at timestamptz not null default now()
);
create index if not exists lots_user_est_idx on public.lots (user_id, establishment_id);

-- ============================================================
-- Per-lot, per-month records (hpg, weights, treatments)
-- rows stored as JSONB to match the existing client shape
-- ============================================================
create table if not exists public.hpg_records (
  lot_id uuid not null references public.lots on delete cascade,
  month_key text not null,
  rows jsonb not null default '[]'::jsonb,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (lot_id, month_key)
);

create table if not exists public.weight_records (
  lot_id uuid not null references public.lots on delete cascade,
  month_key text not null,
  rows jsonb not null default '[]'::jsonb,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (lot_id, month_key)
);

create table if not exists public.treatments (
  lot_id uuid not null references public.lots on delete cascade,
  month_key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (lot_id, month_key)
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.establishments enable row level security;
alter table public.lots enable row level security;
alter table public.hpg_records enable row level security;
alter table public.weight_records enable row level security;
alter table public.treatments enable row level security;

-- profiles: self only
drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- establishments: owner only
drop policy if exists "establishments owner" on public.establishments;
create policy "establishments owner" on public.establishments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- lots: owner only
drop policy if exists "lots owner" on public.lots;
create policy "lots owner" on public.lots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- hpg_records / weight_records / treatments: through lot ownership
drop policy if exists "hpg via lot" on public.hpg_records;
create policy "hpg via lot" on public.hpg_records
  for all
  using (
    exists (select 1 from public.lots l
            where l.id = hpg_records.lot_id and l.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lots l
            where l.id = hpg_records.lot_id and l.user_id = auth.uid())
  );

drop policy if exists "weights via lot" on public.weight_records;
create policy "weights via lot" on public.weight_records
  for all
  using (
    exists (select 1 from public.lots l
            where l.id = weight_records.lot_id and l.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lots l
            where l.id = weight_records.lot_id and l.user_id = auth.uid())
  );

drop policy if exists "treatments via lot" on public.treatments;
create policy "treatments via lot" on public.treatments
  for all
  using (
    exists (select 1 from public.lots l
            where l.id = treatments.lot_id and l.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lots l
            where l.id = treatments.lot_id and l.user_id = auth.uid())
  );
