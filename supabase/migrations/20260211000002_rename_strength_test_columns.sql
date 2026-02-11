-- Migration: Rename hip/knee columns in strength_tests
-- Description: Rename hip → hip_hinge and knee → knee_dominant for clarity

ALTER TABLE strength_tests RENAME COLUMN hip TO hip_hinge;
ALTER TABLE strength_tests RENAME COLUMN knee TO knee_dominant;
