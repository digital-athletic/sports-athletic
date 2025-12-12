-- Migration: Create user_exercises table
-- Description: Per-exercise user state and performance tracking

-- ============================================
-- ENUM TYPES
-- ============================================

-- Exercise difficulty enum (if not exists)
DO $$ BEGIN
  CREATE TYPE exercise_difficulty_enum AS ENUM ('TOO_HARD', 'TOO_EASY', 'SUCCEEDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLE DEFINITION
-- ============================================

CREATE TABLE user_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL,
  repetition INTEGER,
  weight DECIMAL(10,2),
  duration INTEGER,
  height DECIMAL(10,2),
  weight_type TEXT,
  next_weight_percentage DECIMAL(5,2),
  set_active_run INTEGER,
  set_num_of_sets INTEGER,
  skipped BOOLEAN DEFAULT false,
  skill TEXT,
  branch_id INTEGER,
  feedback_difficulty exercise_difficulty_enum,
  feedback_streak_counter INTEGER DEFAULT 0,
  max_f_level_adjustment exercise_difficulty_enum,
  max_f_repetitions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_user_exercises_user_id ON user_exercises(user_id);
CREATE INDEX idx_user_exercises_exercise_id ON user_exercises(exercise_id);
CREATE INDEX idx_user_exercises_branch_id ON user_exercises(branch_id);
CREATE INDEX idx_user_exercises_skill ON user_exercises(skill);

-- ============================================
-- TRIGGERS
-- ============================================

-- Apply updated_at trigger (reuse existing function from teams migration)
CREATE TRIGGER update_user_exercises_updated_at
  BEFORE UPDATE ON user_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_exercises ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if a user is a trainer/owner of another user via team membership
-- Returns true if trainer_id owns a team where target_user_id is a member
CREATE OR REPLACE FUNCTION is_trainer_of_user(trainer_id UUID, target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM teams t
    INNER JOIN team_members tm ON tm.team_id = t.id
    WHERE t.owner_id = trainer_id
    AND tm.user_id = target_user_id
  );
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- INSERT: Users can only create exercise data for themselves
CREATE POLICY "Users can create their own exercise data"
  ON user_exercises FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- SELECT: Users can read their own data OR if they are a trainer/owner of the user
CREATE POLICY "Users can view own data or as trainer"
  ON user_exercises FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_trainer_of_user(auth.uid(), user_id)
  );

-- UPDATE: Only the owning user can update their data
CREATE POLICY "Users can update only their own exercise data"
  ON user_exercises FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Only the owning user can delete their data
CREATE POLICY "Users can delete only their own exercise data"
  ON user_exercises FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
