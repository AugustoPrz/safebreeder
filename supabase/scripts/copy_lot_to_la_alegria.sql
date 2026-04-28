-- One-shot: copy "Lote 1" (28a75198-dd1a-48c0-b85b-f18a5794217c)
-- from ferrandojoaquin125@gmail.com → augusto@paperstreetmedia.com (La Alegría)
--
-- How to run: paste in Supabase Dashboard → SQL Editor → Run.
-- The new lot id is printed in the NOTICE output at the end.

do $$
declare
  src_lot_id  uuid := '28a75198-dd1a-48c0-b85b-f18a5794217c';
  dst_est_id  uuid := 'f9520b5e-416a-462b-a459-9358de831666';
  src_user_id uuid;
  dst_user_id uuid;
  est_owner   uuid;
  new_lot_id  uuid := gen_random_uuid();
  src_lot     record;
begin
  -- Resolve users by email
  select id into src_user_id from auth.users
    where email = 'ferrandojoaquin125@gmail.com' limit 1;
  select id into dst_user_id from auth.users
    where email = 'augusto@paperstreetmedia.com' limit 1;

  if src_user_id is null then raise exception 'source user not found: ferrandojoaquin125@gmail.com'; end if;
  if dst_user_id is null then raise exception 'dest user not found: augusto@paperstreetmedia.com'; end if;

  -- Verify the destination establishment exists and belongs to augusto
  select user_id into est_owner from public.establishments where id = dst_est_id;
  if est_owner is null then raise exception 'destination establishment % not found', dst_est_id; end if;
  if est_owner <> dst_user_id then
    raise exception 'establishment % does not belong to dest user (% vs %)', dst_est_id, est_owner, dst_user_id;
  end if;

  -- Fetch source lot (owned by src user). If it doesn't match the src email,
  -- copy it anyway from whatever user owns it but warn loudly.
  select * into src_lot from public.lots where id = src_lot_id;
  if src_lot is null then raise exception 'source lot % not found at all', src_lot_id; end if;
  if src_lot.user_id <> src_user_id then
    raise notice 'source lot belongs to user % (not %); copying anyway', src_lot.user_id, src_user_id;
  end if;

  -- Insert the lot under the dest user / establishment
  insert into public.lots (id, user_id, establishment_id, name, category, head_count)
  values (new_lot_id, dst_user_id, dst_est_id, src_lot.name, src_lot.category, src_lot.head_count);

  -- Copy related rows
  insert into public.hpg_records (lot_id, month_key, rows, notes, sample_date)
  select new_lot_id, month_key, rows, notes, sample_date
    from public.hpg_records where lot_id = src_lot_id;

  insert into public.weight_records (lot_id, month_key, rows, notes)
  select new_lot_id, month_key, rows, notes
    from public.weight_records where lot_id = src_lot_id;

  insert into public.treatments (lot_id, month_key, data)
  select new_lot_id, month_key, data
    from public.treatments where lot_id = src_lot_id;

  insert into public.vaccines (lot_id, month_key, data)
  select new_lot_id, month_key, data
    from public.vaccines where lot_id = src_lot_id;

  -- Stock table is optional (added in migration 007). Skip cleanly if absent.
  begin
    insert into public.stock (lot_id, rows)
    select new_lot_id, rows
      from public.stock where lot_id = src_lot_id;
  exception when undefined_table then
    raise notice 'stock table not present (migration 007 not applied) — skipped';
  end;

  raise notice 'Copied lot % → new id % under establishment %', src_lot_id, new_lot_id, dst_est_id;
end $$;
