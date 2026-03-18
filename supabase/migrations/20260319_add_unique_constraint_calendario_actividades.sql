-- Migration: 20260319_add_unique_constraint_calendario_actividades
-- Problem: ON CONFLICT (dedupe_key) requires a UNIQUE constraint, not just an index.
-- The existing index (calendario_actividades_dedupe_key_uniq) uses WHERE dedupe_key IS NOT NULL,
-- which PostgreSQL does not recognize as a valid constraint for ON CONFLICT (error 42P10).
--
-- Solution: Add an explicit UNIQUE constraint on dedupe_key.
-- This is additive and non-destructive.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'calendario_actividades_dedupe_key_unique'
  ) THEN
    ALTER TABLE public.calendario_actividades 
    ADD CONSTRAINT calendario_actividades_dedupe_key_unique UNIQUE (dedupe_key);
  END IF;
END
$$;
