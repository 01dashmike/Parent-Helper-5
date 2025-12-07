-- Optimize Geospatial Search Query
-- Adds PostGIS support, spatial indexes, and optimized query function
-- 
-- BEFORE: Basic text matching with ILIKE, no spatial indexing
-- AFTER: PostGIS ST_DWithin with GIST spatial index, optimized pagination
--
-- Expected improvements:
-- - 10-100x faster queries for location-based searches
-- - Spatial index usage (GIST) instead of sequential scans
-- - Better handling of high-density locations (London)
-- - Keyset pagination for consistent performance

-- 1. Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add geography column for spatial indexing (if not exists)
-- Using geography type for accurate distance calculations on Earth's surface
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'location_geog'
  ) THEN
    ALTER TABLE public.classes 
    ADD COLUMN location_geog geography(POINT, 4326);
    
    -- Populate geography column from existing latitude/longitude
    UPDATE public.classes
    SET location_geog = ST_SetSRID(
      ST_MakePoint(
        longitude::double precision,
        latitude::double precision
      ),
      4326
    )::geography
    WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL
      AND latitude != 0 
      AND longitude != 0;
  END IF;
END $$;

-- 3. Create GIST spatial index for fast distance queries
-- This index enables ST_DWithin to use spatial index scan instead of sequential scan
CREATE INDEX IF NOT EXISTS idx_classes_location_geog_gist 
  ON public.classes 
  USING GIST (location_geog)
  WHERE location_geog IS NOT NULL;

-- 4. Create composite index for common filter combinations
-- Optimizes queries that filter by is_active + location
CREATE INDEX IF NOT EXISTS idx_classes_active_location 
  ON public.classes (is_active, id)
  WHERE is_active = true AND location_geog IS NOT NULL;

-- 5. Create index for town searches (for fallback when coordinates unavailable)
CREATE INDEX IF NOT EXISTS idx_classes_town_active 
  ON public.classes (town, is_active)
  WHERE is_active = true;

-- 6. Create index for age group filtering (common search filter)
CREATE INDEX IF NOT EXISTS idx_classes_age_groups 
  ON public.classes (age_group_min, age_group_max, is_active)
  WHERE is_active = true;

-- 7. Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_classes_category_active 
  ON public.classes (category, is_active)
  WHERE is_active = true;

-- 8. Optimized geospatial search function with keyset pagination
-- Uses ST_DWithin for efficient spatial filtering with GIST index
CREATE OR REPLACE FUNCTION search_classes_geospatial(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km INTEGER DEFAULT 10,
  p_category TEXT DEFAULT NULL,
  p_age_min INTEGER DEFAULT NULL,
  p_age_max INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_last_id INTEGER DEFAULT NULL -- For keyset pagination
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
    -- First pass: Use spatial index to filter by distance
    -- ST_DWithin uses GIST index for fast filtering
    SELECT 
      c.id,
      c.name,
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
    FROM public.classes c
    WHERE 
      c.is_active = true
      AND c.location_geog IS NOT NULL
      -- ST_DWithin uses spatial index - much faster than calculating distance for all rows
      AND ST_DWithin(c.location_geog, v_search_point, v_radius_meters)
      -- Keyset pagination: only fetch rows after last_id
      AND (p_last_id IS NULL OR c.id > p_last_id)
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
      c.id ASC
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

-- 9. Create function for high-density location handling (London, etc.)
-- Uses adaptive radius based on location density
-- Updated to use materialized view for better performance
CREATE OR REPLACE FUNCTION search_classes_adaptive_radius(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_category TEXT DEFAULT NULL,
  p_age_min INTEGER DEFAULT NULL,
  p_age_max INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
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
  v_radius_km INTEGER;
  v_class_count INTEGER;
BEGIN
  v_search_point := ST_SetSRID(
    ST_MakePoint(p_longitude, p_latitude),
    4326
  )::geography;
  
  -- Start with small radius for dense areas
  v_radius_km := 2;
  
  -- Check if we're in a high-density area (London: 51.5074, -0.1278)
  -- Or other major cities
  IF (
    p_latitude BETWEEN 51.0 AND 52.0 AND 
    p_longitude BETWEEN -1.0 AND 0.5
  ) THEN
    -- London area: start with 2km radius
    v_radius_km := 2;
  ELSE
    -- Other areas: start with 5km radius
    v_radius_km := 5;
  END IF;
  
  -- Count classes in initial radius using materialized view
  SELECT COUNT(*) INTO v_class_count
  FROM public.mv_classes_geosearch c
  WHERE 
    ST_DWithin(
      c.location_geog, 
      v_search_point, 
      v_radius_km * 1000
    );
  
  -- If too few results, expand radius
  IF v_class_count < p_limit THEN
    v_radius_km := 10;
  END IF;
  
  -- If still too few, expand further
  IF v_class_count < p_limit / 2 THEN
    v_radius_km := 20;
  END IF;
  
  -- Execute search with adaptive radius using materialized view
  RETURN QUERY
  SELECT * FROM search_classes_geospatial_mv(
    p_latitude,
    p_longitude,
    v_radius_km,
    p_category,
    p_age_min,
    p_age_max,
    p_limit,
    p_offset,
    NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. Add comment explaining the optimization
COMMENT ON FUNCTION search_classes_geospatial IS 
'Optimized geospatial search using PostGIS ST_DWithin with GIST spatial index.
Uses keyset pagination for consistent performance.
Expected query plan: Index Scan using idx_classes_location_geog_gist on classes';

COMMENT ON FUNCTION search_classes_adaptive_radius IS 
'Adaptive radius search for high-density locations.
Automatically adjusts search radius based on location density.
Optimized for London and other major cities.';

-- 11. Create trigger to automatically update geography column when lat/lng changes
CREATE OR REPLACE FUNCTION update_location_geog()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL 
     AND NEW.latitude != 0 AND NEW.longitude != 0 THEN
    NEW.location_geog := ST_SetSRID(
      ST_MakePoint(NEW.longitude::double precision, NEW.latitude::double precision),
      4326
    )::geography;
  ELSE
    NEW.location_geog := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_location_geog ON public.classes;
CREATE TRIGGER trigger_update_location_geog
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION update_location_geog();

-- 12. Analyze tables to update statistics for query planner
ANALYZE public.classes;

