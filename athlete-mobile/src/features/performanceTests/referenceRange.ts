import { type Sport } from "@/features/training/models/UserWorkoutData";
import { ageOnDate, type ISODateString } from "@/utils/date";
import {
  type SportTest,
  type SportTestReferenceValue,
} from "./models/SportTest";
import { type TrainingStage, trainingStageFor } from "./trainingStage";

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

export type AthleteProfile = {
  sport: Sport;
  gender: "MALE" | "FEMALE";
  position: string | undefined;
  birthday: ISODateString;
};

/** The reference range of the training stage the athlete was in on the date. */
export function referenceRangeOnDate(
  test: SportTest,
  athlete: AthleteProfile,
  date: ISODateString,
): SportTestReferenceValue | null {
  const age = ageOnDate(athlete.birthday, date);
  return referenceRangeFor(test, {
    gender: athlete.gender,
    position: athlete.position,
    trainingStage: trainingStageFor(athlete.sport, athlete.gender, age),
  });
}
