create or replace function public.get_admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'userCount', (select count(*) from profiles),
    'totalRevenue', (select coalesce(sum(amount_paid), 0) from transactions),
    'totalCreditsSold', (select coalesce(sum(credits_purchased), 0) from transactions),
    'recentUsers', (
      select coalesce(jsonb_agg(u), '[]'::jsonb)
      from (
        select id, created_at, first_name, last_name, avatar_url
        from profiles
        order by created_at desc
        limit 5
      ) u
    ),
    'featureUsage', (
      with free_counts as (
        select feature_name, count(*) as count
        from free_usage_log
        group by feature_name
      ),
      premium_counts as (
        select feature_name, count(*) as count
        from premium_usage_log
        group by feature_name
      )
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', coalesce(f.feature_name, p.feature_name),
        'free', coalesce(f.count, 0),
        'premium', coalesce(p.count, 0)
      )), '[]'::jsonb)
      from free_counts f
      full outer join premium_counts p on f.feature_name = p.feature_name
    )
  ) into result;

  return result;
end;
$$;