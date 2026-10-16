-- Migration: Add performed load and consecutive too hard count to user_exercises
-- Description: performed_weight stores the rounded load the athlete performed,
-- next to the unrounded weight. too_hard_count stores the consecutive too hard
-- ratings. Both columns are nullable, so existing rows stay valid.

ALTER TABLE user_exercises
  ADD COLUMN performed_weight DECIMAL(10,2),
  ADD COLUMN too_hard_count INTEGER;
