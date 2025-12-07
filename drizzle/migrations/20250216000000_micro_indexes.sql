-- 20250216000000_micro_indexes.sql
-- Adds micro-indexes to support common slow-query filters.
-- Each block safely checks for the required columns before creating the index.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'classes'
      AND column_name = 'class_id'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'classes'
      AND column_name = 'status'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_classes_class_id_status ON public.classes (class_id, status)';
  ELSE
    RAISE NOTICE 'Skipped idx_classes_class_id_status: required columns not found on public.classes';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'providers'
      AND column_name = 'user_id'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'providers'
      AND column_name = 'city'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_providers_user_id_city ON public.providers (user_id, city)';
  ELSE
    RAISE NOTICE 'Skipped idx_providers_user_id_city: required columns not found on public.providers';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'provider_id'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'status'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bookings_provider_id_status ON public.bookings (provider_id, status)';
  ELSE
    RAISE NOTICE 'Skipped idx_bookings_provider_id_status: required columns not found on public.bookings';
  END IF;
END
$$;

