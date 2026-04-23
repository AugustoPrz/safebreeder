-- Migration 003 — admin stats RPC.
-- Run in the Supabase SQL editor.
-- Only callable by users with plan = 'admin' (checked inside the function).

create or replace function public.get_admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  calling_plan text;
  result jsonb;
begin
  select plan into calling_plan from public.profiles where id = auth.uid();
  if calling_plan is distinct from 'admin' then
    raise exception 'Unauthorized';
  end if;

  select jsonb_build_object(
    'totals', jsonb_build_object(
      'users',          (select count(*) from public.profiles),
      'establishments', (select count(*) from public.establishments),
      'lots',           (select count(*) from public.lots)
    ),
    'users', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id',        p.id,
            'email',     p.email,
            'name',      p.name,
            'plan',      p.plan,
            'role',      p.role,
            'created_at', p.created_at,
            'est_count', (select count(*) from public.establishments e where e.user_id = p.id),
            'lot_count', (select count(*) from public.lots l where l.user_id = p.id)
          )
          order by p.created_at desc
        ),
        '[]'::jsonb
      )
      from public.profiles p
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.get_admin_stats() to authenticated;
