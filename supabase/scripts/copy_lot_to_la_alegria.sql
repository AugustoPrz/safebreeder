-- One-shot: copy "Lote 1" (28a75198-dd1a-48c0-b85b-f18a5794217c)
-- from ferrandojoaquin125@gmail.com → augusto@paperstreetmedia.com (La Alegría)
--
-- How to run: paste in Supabase Dashboard → SQL Editor → Run.
-- The new lot id is printed in the NOTICE output at the end.

do $$
declare
  src_lot_id  uuid := '28a75198-dd1a-48c0-b85b-f18a5794217c';
  src_user_id uuid;
  dst_user_id uuid;
  dst_est_id  uuid;
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

  -- Resolve destination establishment "La Alegría" (also matches "La Alegria")
  select id into dst_est_id
    from public.establishments
   where user_id = dst_user_id
     and (name = 'La Alegría' or name ilike 'La Alegr%')
   order by case when name = 'La Alegría' then 0 else 1 end
   limit 1;
  if dst_est_id is null then raise exception 'dest establishment "La Alegría" not found for augusto'; end if;

  -- Fetch source lot (owned by src user)
  select * into src_lot from public.lots where id = src_lot_id and user_id = src_user_id;
  if src_lot is null then raise exception 'source lot % not found for src user', src_lot_id; end if;

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
