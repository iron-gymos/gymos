-- Iron Gym OS V2 - Migration 005
-- Dashboard summary RPC for Phase 2 App Shell.
-- Already applied to the connected Supabase project by Nova.

create or replace function public.get_app_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_display_name text;
  v_role public.user_role;
  v_is_global boolean;
  v_branch_ids uuid[];
  v_month_start timestamptz := date_trunc('month', now());
  v_result jsonb;
begin
  select au.id, au.display_name, au.role
  into v_user_id, v_display_name, v_role
  from public.app_users au
  where au.auth_user_id = auth.uid()
    and au.is_active = true
  limit 1;

  if v_user_id is null then
    raise exception 'App user profile required';
  end if;

  v_is_global := v_role in ('OWNER'::public.user_role, 'SUPER_ADMIN'::public.user_role);

  if v_is_global then
    select coalesce(array_agg(b.id), array[]::uuid[])
    into v_branch_ids
    from public.branches b
    where b.is_active = true;
  else
    select coalesce(array_agg(bs.branch_id), array[]::uuid[])
    into v_branch_ids
    from public.branch_staff bs
    where bs.user_id = v_user_id
      and bs.end_date is null;
  end if;

  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_user_id,
      'displayName', v_display_name,
      'role', v_role::text,
      'isGlobal', v_is_global
    ),
    'stats', jsonb_build_object(
      'branches', (select count(*)::int from public.branches b where b.is_active = true and (v_is_global or b.id = any(v_branch_ids))),
      'staff', (select count(*)::int from public.branch_staff bs where bs.end_date is null and (v_is_global or bs.branch_id = any(v_branch_ids))),
      'customers', (select count(*)::int from public.customers c where c.status = 'ACTIVE'::public.customer_status and (v_is_global or c.branch_id = any(v_branch_ids))),
      'packageProducts', (select count(*)::int from public.package_products pp where pp.is_active = true and (pp.branch_id is null or v_is_global or pp.branch_id = any(v_branch_ids))),
      'activePackages', (select count(*)::int from public.customer_packages cp where cp.status = 'ACTIVE'::public.customer_package_status and (v_is_global or cp.branch_id = any(v_branch_ids))),
      'trainingPrograms', (select count(*)::int from public.training_programs tp where tp.is_active = true and (tp.branch_id is null or v_is_global or tp.branch_id = any(v_branch_ids))),
      'monthlySales', (select coalesce(sum(si.total_amount), 0)::numeric from public.sales_invoices si where si.sold_at >= v_month_start and si.status not in ('CANCELLED'::public.invoice_status, 'REFUNDED'::public.invoice_status) and (v_is_global or si.branch_id = any(v_branch_ids))),
      'monthlySessions', (select count(*)::int from public.training_session_logs tsl where tsl.session_start >= v_month_start and (v_is_global or tsl.branch_id = any(v_branch_ids)))
    ),
    'branches', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'code', b.code, 'name', b.name, 'timezone', b.timezone, 'isActive', b.is_active) order by b.code)
      from public.branches b
      where b.is_active = true and (v_is_global or b.id = any(v_branch_ids))
    ), '[]'::jsonb),
    'packageBreakdown', coalesce((
      select jsonb_object_agg(package_count.category, package_count.total)
      from (
        select pp.category::text as category, count(*)::int as total
        from public.package_products pp
        where pp.is_active = true and (pp.branch_id is null or v_is_global or pp.branch_id = any(v_branch_ids))
        group by pp.category
      ) package_count
    ), '{}'::jsonb),
    'generatedAt', now()
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_app_dashboard_summary() to authenticated, service_role;
notify pgrst, 'reload schema';
