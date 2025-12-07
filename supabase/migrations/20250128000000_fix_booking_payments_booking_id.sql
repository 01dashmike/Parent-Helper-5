-- Fix booking_payments.booking_id to reference simple_bookings.id (UUID) instead of bookings.id (integer)
-- Migration: 20250128_fix_booking_payments_booking_id

-- Step 1: Drop existing foreign key constraint if it exists
DO $$
BEGIN
  -- Drop the foreign key constraint
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'booking_payments_booking_id_fkey'
    AND table_name = 'booking_payments'
  ) THEN
    ALTER TABLE public.booking_payments 
    DROP CONSTRAINT booking_payments_booking_id_fkey;
  END IF;
END $$;

-- Step 2: Drop the unique index on booking_id (will be recreated after type change)
DROP INDEX IF EXISTS public.booking_payments_booking_idx;

-- Step 3: Delete all existing rows since they reference bookings table (integer IDs)
-- These are incompatible with simple_bookings UUID IDs
-- Note: This is safe because simple_bookings is the new system and booking_payments
-- should only reference simple_bookings going forward. Old booking_payments records
-- referenced the legacy bookings table which uses integer IDs.
DELETE FROM public.booking_payments;

-- Step 4: Change booking_id column type from integer to UUID
-- Since we've deleted all rows, we can safely change the type
ALTER TABLE public.booking_payments 
ALTER COLUMN booking_id TYPE uuid;

-- Step 5: Add foreign key constraint to simple_bookings
ALTER TABLE public.booking_payments
ADD CONSTRAINT booking_payments_booking_id_fkey 
FOREIGN KEY (booking_id) 
REFERENCES public.simple_bookings(id) 
ON DELETE CASCADE;

-- Step 6: Recreate unique index on booking_id
CREATE UNIQUE INDEX IF NOT EXISTS booking_payments_booking_idx 
ON public.booking_payments(booking_id);

-- Step 7: Add comment to document the change
COMMENT ON COLUMN public.booking_payments.booking_id IS 
'References simple_bookings.id (UUID). Changed from integer to UUID to match simple_bookings table.';

