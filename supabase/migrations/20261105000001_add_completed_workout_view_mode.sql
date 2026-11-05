-- Migration: Add the workout view to user_completed_workouts
-- Description: view_mode stores the view the athlete started the workout in.
-- The column is nullable, so rows from older app versions stay valid.

ALTER TABLE user_completed_workouts
  ADD COLUMN view_mode TEXT;
