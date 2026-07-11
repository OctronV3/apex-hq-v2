-- Expand newsletter pipeline stages to the full workflow.
-- Allow new stage values and migrate legacy 'sent' to 'published'.

-- Remove any existing check constraint on the newsletters stage column.
-- This handles the unnamed check created by the initial migration.
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE cls.relname = 'newsletters'
      AND ns.nspname = 'public'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%stage%'
  LOOP
    EXECUTE format('ALTER TABLE public.newsletters DROP CONSTRAINT %I', constraint_record.conname);
  END LOOP;
END $$;

-- Migrate legacy sent stage to published.
UPDATE public.newsletters SET stage = 'published' WHERE stage = 'sent';

-- Add a named check constraint for the new stage values.
ALTER TABLE public.newsletters
  ADD CONSTRAINT newsletters_stage_check
  CHECK (stage IN ('idea', 'research', 'writing', 'editing', 'review', 'graphics', 'scheduled', 'published', 'archived'));
