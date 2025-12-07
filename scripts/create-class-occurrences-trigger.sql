-- Trigger to prevent overlapping occurrences for the same class
-- This trigger checks for time overlaps before inserting/updating

CREATE OR REPLACE FUNCTION check_class_occurrence_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlapping_count INTEGER;
  class_venue_id INTEGER;
BEGIN
  -- Get the venue_id from the class (if classes have venue_id)
  -- For now, we'll check overlaps per class_id
  -- If you need venue-level overlap checking, uncomment and adjust:
  -- SELECT venue_id INTO class_venue_id FROM classes WHERE id = NEW.class_id;
  
  -- Check for overlapping occurrences for the same class
  SELECT COUNT(*) INTO overlapping_count
  FROM class_occurrences
  WHERE class_id = NEW.class_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      -- New occurrence starts during an existing occurrence
      (NEW.start_at >= start_at AND NEW.start_at < end_at)
      OR
      -- New occurrence ends during an existing occurrence
      (NEW.end_at > start_at AND NEW.end_at <= end_at)
      OR
      -- New occurrence completely contains an existing occurrence
      (NEW.start_at <= start_at AND NEW.end_at >= end_at)
      OR
      -- Existing occurrence completely contains the new occurrence
      (start_at <= NEW.start_at AND end_at >= NEW.end_at)
    );

  IF overlapping_count > 0 THEN
    RAISE EXCEPTION 'Overlapping occurrence detected for class_id %. An occurrence already exists between % and %',
      NEW.class_id, NEW.start_at, NEW.end_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (with warning mode option - set to false to enforce strict overlap prevention)
CREATE OR REPLACE TRIGGER prevent_class_occurrence_overlap
  BEFORE INSERT OR UPDATE ON class_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION check_class_occurrence_overlap();

-- Optional: Create a function for warning mode (logs warning but allows insert)
CREATE OR REPLACE FUNCTION warn_class_occurrence_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlapping_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO overlapping_count
  FROM class_occurrences
  WHERE class_id = NEW.class_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (NEW.start_at >= start_at AND NEW.start_at < end_at)
      OR (NEW.end_at > start_at AND NEW.end_at <= end_at)
      OR (NEW.start_at <= start_at AND NEW.end_at >= end_at)
      OR (start_at <= NEW.start_at AND end_at >= NEW.end_at)
    );

  IF overlapping_count > 0 THEN
    RAISE WARNING 'Overlapping occurrence detected for class_id % between % and %', 
      NEW.class_id, NEW.start_at, NEW.end_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- To enable warning mode instead of strict prevention, drop the prevent trigger and create this:
-- DROP TRIGGER IF EXISTS prevent_class_occurrence_overlap ON class_occurrences;
-- CREATE TRIGGER warn_class_occurrence_overlap
--   BEFORE INSERT OR UPDATE ON class_occurrences
--   FOR EACH ROW
--   EXECUTE FUNCTION warn_class_occurrence_overlap();

