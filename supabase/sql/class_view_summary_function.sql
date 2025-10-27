CREATE OR REPLACE FUNCTION public.get_class_view_summary()
RETURNS TABLE(date DATE, views INTEGER)
AS $$
  SELECT
    DATE(viewed_at) AS date,
    COUNT(*) AS views
  FROM public.class_views
  WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(viewed_at)
  ORDER BY DATE(viewed_at);
$$ LANGUAGE sql STABLE;
