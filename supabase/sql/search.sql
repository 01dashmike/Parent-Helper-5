-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Basic indexes (adjust names if already exist)
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes (is_active);
CREATE INDEX IF NOT EXISTS idx_classes_category ON classes (category);
CREATE INDEX IF NOT EXISTS idx_classes_town ON classes (town);

-- Text search (title/description)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS tsv tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(description,'')), 'B')
) STORED;
CREATE INDEX IF NOT EXISTS idx_classes_tsv ON classes USING GIN (tsv);

-- Trigram for fuzzy name lookups
CREATE INDEX IF NOT EXISTS idx_classes_name_trgm ON classes USING GIN (name gin_trgm_ops);

-- Geo: store as geography for fast radius queries
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS geo geography(Point, 4326);

UPDATE classes
SET geo = ST_SetSRID(ST_MakePoint(CAST(longitude AS DOUBLE PRECISION), CAST(latitude AS DOUBLE PRECISION)), 4326)::geography
WHERE geo IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classes_geo ON classes USING GIST (geo);

-- RPC: search_classes
CREATE OR REPLACE FUNCTION public.search_classes(
  in_lat DOUBLE PRECISION,
  in_lng DOUBLE PRECISION,
  in_radius_km DOUBLE PRECISION,
  in_query TEXT,
  in_category TEXT,
  in_limit INT,
  in_offset INT
)
RETURNS TABLE (
  id INT,
  name TEXT,
  description TEXT,
  category TEXT,
  town TEXT,
  postcode TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT
    c.id,
    c.name,
    c.description,
    c.category,
    c.town,
    c.postcode,
    c.latitude,
    c.longitude,
    CASE 
      WHEN in_lat IS NOT NULL AND in_lng IS NOT NULL AND c.geo IS NOT NULL THEN
        ST_DistanceSphere(c.geo::geometry, ST_MakePoint(in_lng, in_lat)) / 1000.0
      ELSE NULL
    END AS distance_km
  FROM classes c
  WHERE c.is_active = TRUE
    AND (in_category IS NULL OR in_category = '' OR c.category = in_category)
    AND (
      COALESCE(in_query, '') = '' 
      OR c.tsv @@ plainto_tsquery('english', in_query)
      OR c.name ILIKE '%' || in_query || '%'
    )
    AND (
      in_lat IS NULL OR in_lng IS NULL OR in_radius_km IS NULL OR c.geo IS NULL
      OR ST_DWithin(
          c.geo,
          geography(ST_MakePoint(in_lng, in_lat)),
          in_radius_km * 1000.0
        )
    )
  ORDER BY
    CASE WHEN distance_km IS NULL THEN 1 ELSE 0 END,
    distance_km NULLS LAST,
    c.popularity DESC NULLS LAST
  LIMIT GREATEST(in_limit, 1)
  OFFSET GREATEST(in_offset, 0);
$$;

-- (Optional) grant execute to anon if you plan to call from client; 
-- recommended: call from server route using service role instead.

-- Seed helper table is not required here; a separate seed script will insert rows.

-- Done.
