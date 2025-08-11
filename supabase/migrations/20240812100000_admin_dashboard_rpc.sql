create or replace function get_admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
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
      with all_features as (
        select feature_name from free_usage_log
        union
        select feature_name from premium_usage_log
      ),
      feature_counts as (
        select
          f.feature_name,
          coalesce(free.count, 0) as free_count,
          coalesce(premium.count, 0) as premium_count
        from all_features f
        left join (
          select feature_name, count(*) as count
          from free_usage_log
          group by feature_name
        ) free on f.feature_name = free.feature_name
        left join (
          select feature_name, count(*) as count
          from premium_usage_log
          group by feature_name
        ) premium on f.feature_name = premium.feature_name
      )
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', feature_name,
        'free', free_count,
        'premium', premium_count
      )), '[]'::jsonb)
      from feature_counts
    )
  ) into result;

  return result;
end;
$$;