-- Migration: Change exercise_id and branch_id from INTEGER to TEXT
-- Description: Aligns DB column types with client-side string types.
--   This operation acquires an ACCESS EXCLUSIVE lock on user_exercises
--   and rewrites existing data. This is a one-way migration; reversing
--   to INTEGER will fail if non-numeric TEXT values have been inserted.

-- ============================================
-- ALTER COLUMNS
-- ============================================

ALTER TABLE user_exercises
  ALTER COLUMN exercise_id TYPE TEXT USING exercise_id::TEXT;

ALTER TABLE user_exercises
  ALTER COLUMN branch_id TYPE TEXT USING branch_id::TEXT;
