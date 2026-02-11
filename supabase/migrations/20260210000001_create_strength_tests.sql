-- Migration: Create strength_tests table
-- Description: Strength test results per user, storing max values for each movement pattern

-- ============================================
-- TABLE DEFINITION
-- ============================================

CREATE TABLE strength_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date TEXT NOT NULL,
  vertical_push JSONB,
  vertical_pull JSONB,
  horizontal_push JSONB,
  horizontal_pull JSONB,
  hip JSONB,
  knee JSONB,
  lower_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, test_date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_strength_tests_user_id ON strength_tests(user_id);
CREATE INDEX idx_strength_tests_user_date ON strength_tests(user_id, test_date DESC);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_strength_tests_updated_at
  BEFORE UPDATE ON strength_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE strength_tests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- INSERT: Users can only create strength test results for themselves
CREATE POLICY "Users can create their own strength tests"
  ON strength_tests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- SELECT: Users can read their own data OR if they are a trainer/owner of the user
CREATE POLICY "Users can view own strength tests or as trainer"
  ON strength_tests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_trainer_of_user(auth.uid(), user_id)
  );

-- UPDATE: Only the owning user can update their data
CREATE POLICY "Users can update only their own strength tests"
  ON strength_tests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Only the owning user can delete their data
CREATE POLICY "Users can delete only their own strength tests"
  ON strength_tests FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
