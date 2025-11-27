export type ExerciseBranchType = {
  exerciseBranchId: number;
  tags: string[];
  exercises: { [level: number]: { exerciseId: number } };
};
