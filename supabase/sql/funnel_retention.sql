CREATE OR REPLACE VIEW public.funnel_summary AS
SELECT
  DATE_TRUNC('day', c.created_at) AS day,
  COUNT(DISTINCT c.id) AS views,
  COUNT(DISTINCT n.email) AS signups,
  COUNT(DISTINCT b.id) AS bookings
FROM public.class_views c
LEFT JOIN public.newsletter_events n
  ON DATE_TRUNC('day', n.created_at) = DATE_TRUNC('day', c.created_at)
LEFT JOIN public.bookings b
  ON DATE_TRUNC('day', b.created_at) = DATE_TRUNC('day', c.created_at)
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW public.retention_summary AS
SELECT
  parent_email,
  MIN(created_at) AS first_visit,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS total_bookings,
  DATE_PART('day', MAX(created_at) - MIN(created_at)) AS days_between_first_last
FROM public.bookings
GROUP BY parent_email;
