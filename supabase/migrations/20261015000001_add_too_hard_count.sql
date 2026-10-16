-- Migration: Add consecutive too hard count to user_exercises
-- Description: too_hard_count stores the consecutive too hard ratings. The
-- column is nullable, so existing rows stay valid.

ALTER TABLE user_exercises
  ADD COLUMN too_hard_count INTEGER;
