const trainingLevels = [
  "default",
  "beginner",
  "intermediate",
  "advanced",
  "professional",
] as const;

export type TrainingLevelType = (typeof trainingLevels)[number];

export const isTrainingLevel = (value: unknown): value is TrainingLevelType =>
  typeof value === "string" &&
  trainingLevels.includes(value as TrainingLevelType);
