-- Materialized View for Accelerated Geospatial Search
-- Creates mv_classes_geosearch with optimized fields and indexes
-- Refreshed via cron job every 10 minutes

-- 1. Create materialized view with essential fields for geospatial search
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_classes_geosearch AS
SELECT 
  c.id AS class_id,
  COALESCE(c.title, c.name) AS title,
  c.category,
  c.town,
  c.location_geog,
  COALESCE(c.popularity, 0) AS popularity,
  c.age_group_min,
  c.age_group_max,
  c.is_active,
  c.is_featured,
  c.featured_priority,
  c.featured_status,
  c.featured_starts_at,
  c.featured_ends_at,
  c.review_count,
  c.latitude,
  c.longitude,
  c.description,
  c.provider_id
FROM public.classes c
WHERE c.is_active = true
  AND c.location_geog IS NOT NULL;

-- 2. Create GIST index on location_geog for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_mv_classes_geosearch_location_gist 
  ON public.mv_classes_geosearch 
  USING GIST (location_geog);

-- 3. Create BTREE index on popularity + category for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_mv_classes_geosearch_popularity_category 
  ON public.mv_classes_geosearch (popularity DESC, category);

-- 4. Create additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_mv_classes_geosearch_category 
  ON public.mv_classes_geosearch (category)
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mv_classes_geosearch_town 
  ON public.mv_classes_geosearch (town)
  WHERE town IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mv_classes_geosearch_age_groups 
  ON public.mv_classes_geosearch (age_group_min, age_group_max);

CREATE INDEX IF NOT EXISTS idx_mv_classes_geosearch_featured 
  ON public.mv_classes_geosearch (is_featured DESC, featured_priority DESC)
  WHERE is_featured = true;

-- 5. Create unique index on class_id for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_classes_geosearch_class_id 
  ON public.mv_classes_geosearch (class_id);

-- 6. Create function to refresh materialized view (for cron job)
CREATE OR REPLACE FUNCTION refresh_mv_classes_geosearch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_classes_geosearch;
END;
$$;

-- 7. Add comment explaining the materialized view
COMMENT ON MATERIALIZED VIEW public.mv_classes_geosearch IS 
'Materialized view for accelerated geospatial search queries.
Contains only active classes with valid location data.
Refreshed every 10 minutes via cron job.
Use REFRESH MATERIALIZED VIEW CONCURRENTLY to update without blocking reads.';

COMMENT ON FUNCTION refresh_mv_classes_geosearch() IS 
'Refreshes the mv_classes_geosearch materialized view concurrently.
Called by cron job every 10 minutes.
Does not block reads during refresh.';

-- 8. Create optimized search function using materialized view
CREATE OR REPLACE FUNCTION search_classes_geospatial_mv(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km INTEGER DEFAULT 10,
  p_category TEXT DEFAULT NULL,
  p_age_min INTEGER DEFAULT NULL,
  p_age_max INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_last_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  category TEXT,
  town TEXT,
  age_group_min INTEGER,
  age_group_max INTEGER,
  is_featured BOOLEAN,
  distance_km DOUBLE PRECISION,
  search_score DOUBLE PRECISION
) AS $$
DECLARE
  v_search_point geography;
  v_radius_meters INTEGER;
BEGIN
  -- Convert search coordinates to geography point
  v_search_point := ST_SetSRID(
    ST_MakePoint(p_longitude, p_latitude),
    4326
  )::geography;
  
  -- Convert radius from km to meters (ST_DWithin uses meters)
  v_radius_meters := p_radius_km * 1000;
  
  RETURN QUERY
  WITH spatial_filter AS (
    -- Use materialized view for faster queries
    SELECT 
      c.class_id AS id,
      c.title AS name,
      c.description,
      c.latitude,
      c.longitude,
      c.category,
      c.town,
      c.age_group_min,
      c.age_group_max,
      c.is_featured,
      c.popularity,
      c.review_count,
      c.featured_priority,
      -- Calculate distance in km using ST_Distance
      ST_Distance(c.location_geog, v_search_point) / 1000.0 AS distance_km
    FROM public.mv_classes_geosearch c
    WHERE 
      -- ST_DWithin uses spatial index - much faster than calculating distance for all rows
      ST_DWithin(c.location_geog, v_search_point, v_radius_meters)
      -- Keyset pagination: only fetch rows after last_id
      AND (p_last_id IS NULL OR c.class_id > p_last_id)
      -- Additional filters
      AND (p_category IS NULL OR LOWER(c.category) = LOWER(p_category))
      AND (
        p_age_min IS NULL OR p_age_max IS NULL OR
        (c.age_group_min <= p_age_max AND c.age_group_max >= p_age_min)
      )
    ORDER BY 
      -- Prioritize featured classes, then by distance
      c.is_featured DESC,
      distance_km ASC,
      c.class_id ASC
    LIMIT p_limit + 1 -- Fetch one extra for pagination check
  ),
  scored_results AS (
    -- Second pass: Calculate search score
    SELECT 
      sf.*,
      -- Search score: featured boost + distance penalty + popularity
      (
        CASE WHEN sf.is_featured THEN 1000 ELSE 0 END +
        CASE WHEN sf.featured_priority IS NOT NULL THEN sf.featured_priority * 10 ELSE 0 END +
        COALESCE(sf.popularity, 0) * 2 +
        COALESCE(sf.review_count, 0) -
        -- Distance penalty: closer is better (subtract distance * 10)
        (sf.distance_km * 10)
      ) AS search_score
    FROM spatial_filter sf
  )
  SELECT 
    sr.id,
    sr.name,
    sr.description,
    sr.latitude,
    sr.longitude,
    sr.category,
    sr.town,
    sr.age_group_min,
    sr.age_group_max,
    sr.is_featured,
    sr.distance_km,
    sr.search_score
  FROM scored_results sr
  ORDER BY sr.search_score DESC, sr.distance_km ASC, sr.id ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_classes_geospatial_mv() IS 
'Optimized geospatial search using materialized view mv_classes_geosearch.
Uses GIST spatial index for fast distance queries.
Expected query plan: Index Scan using idx_mv_classes_geosearch_location_gist on mv_classes_geosearch';

-- 9. Initial refresh of materialized view (populates it with current data)
REFRESH MATERIALIZED VIEW public.mv_classes_geosearch;

