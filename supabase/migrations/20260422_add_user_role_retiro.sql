DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
      AND e.enumlabel = 'retiro'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'retiro';
  END IF;
END $$;
