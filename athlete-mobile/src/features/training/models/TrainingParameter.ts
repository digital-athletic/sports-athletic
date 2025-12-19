const trainingParameters = [
  "duration",
  "height",
  "repetition",
  "weight",
] as const;

export type TrainingParameterType = (typeof trainingParameters)[number];

export const isTrainingParameter = (
  value: unknown,
): value is TrainingParameterType =>
  typeof value === "string" &&
  trainingParameters.includes(value as TrainingParameterType);
