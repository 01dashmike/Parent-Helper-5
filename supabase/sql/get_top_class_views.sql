CREATE OR REPLACE FUNCTION public.get_top_class_views(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(class_id INTEGER, views BIGINT)
AS $$
  SELECT class_id, COUNT(*) AS views
  FROM public.class_views
  GROUP BY class_id
  ORDER BY views DESC
  LIMIT limit_count;
$$ LANGUAGE sql STABLE;
