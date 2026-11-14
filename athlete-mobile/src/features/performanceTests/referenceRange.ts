import {
  type SportTest,
  type SportTestReferenceValue,
} from "./models/SportTest";
import { type TrainingStage } from "./trainingStage";

export type AthleteReferenceKey = {
  gender: "MALE" | "FEMALE";
  position: string | undefined;
  trainingStage: TrainingStage | null;
};

export function referenceRangeFor(
  test: SportTest,
  athlete: AthleteReferenceKey,
): SportTestReferenceValue | null {
  if (athlete.position === undefined) return null;
  if (athlete.trainingStage === null) return null;

  const match = test.referenceValues.find(
    (value) =>
      value.gender === athlete.gender &&
      value.position === athlete.position &&
      value.trainingStage === athlete.trainingStage,
  );
  return match ?? null;
}

export function formatRangeNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(
    value,
  );
}
