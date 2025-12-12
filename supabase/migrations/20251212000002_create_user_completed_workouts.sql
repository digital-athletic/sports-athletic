-- Migration: Create user_completed_workouts table
-- Description: Completed workout history tracking
-- Maps: UserCompletedWorkouts/{userId}/{workoutId} (CompletedWorkoutListEntryType)

-- ============================================
-- TABLE DEFINITION
-- ============================================

CREATE TABLE user_completed_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id TEXT NOT NULL,
  workout_date BIGINT NOT NULL,
  duration INTEGER NOT NULL,
  exercise_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  moved_weight DECIMAL(12,2) DEFAULT 0,
  exercises JSONB,
  training_type TEXT,
  training_cardio_type TEXT,
  training_focus TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_user_completed_workouts_user_id ON user_completed_workouts(user_id);
CREATE INDEX idx_user_completed_workouts_workout_date ON user_completed_workouts(user_id, workout_date DESC);
CREATE INDEX idx_user_completed_workouts_training_type ON user_completed_workouts(training_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_completed_workouts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- INSERT: Users can only create completed workout entries for themselves
CREATE POLICY "Users can create their own completed workouts"
  ON user_completed_workouts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- SELECT: Users can read their own data OR if they are a trainer/owner of the user
CREATE POLICY "Users can view own completed workouts or as trainer"
  ON user_completed_workouts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_trainer_of_user(auth.uid(), user_id)
  );

-- UPDATE: Only the owning user can update their data
CREATE POLICY "Users can update only their own completed workouts"
  ON user_completed_workouts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Only the owning user can delete their data
CREATE POLICY "Users can delete only their own completed workouts"
  ON user_completed_workouts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
