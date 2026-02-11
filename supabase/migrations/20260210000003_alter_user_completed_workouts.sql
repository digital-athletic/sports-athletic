-- Migration: Rename points to xp_earned, add user_skills column, add unique constraint
-- Description: Aligns DB schema with client-side field names and adds user_skills JSONB.
--              Adds UNIQUE constraint on (user_id, workout_id) required for upsert sync.

-- ============================================
-- RENAME COLUMN
-- ============================================

ALTER TABLE user_completed_workouts
  RENAME COLUMN points TO xp_earned;

-- ============================================
-- ADD COLUMN
-- ============================================

ALTER TABLE user_completed_workouts
  ADD COLUMN user_skills JSONB;

-- ============================================
-- ADD UNIQUE CONSTRAINT (required for SyncService upsert)
-- ============================================

ALTER TABLE user_completed_workouts
  ADD CONSTRAINT uq_user_completed_workouts_user_workout
  UNIQUE (user_id, workout_id);
