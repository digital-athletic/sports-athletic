import {
  type SportTest,
  type SportTestReferenceValue,
} from "./models/SportTest";

export type AthleteReferenceKey = {
  gender: "MALE" | "FEMALE";
  position: string | undefined;
  age: number | null;
};

export function referenceRangeFor(
  test: SportTest,
  athlete: AthleteReferenceKey,
): SportTestReferenceValue | null {
  if (athlete.position === undefined) return null;
  if (athlete.age === null) return null;

  const { age } = athlete;
  const match = test.referenceValues.find(
    (value) =>
      value.gender === athlete.gender &&
      value.position === athlete.position &&
      value.minAge <= age &&
      age <= value.maxAge,
  );
  return match ?? null;
}

export function formatRangeNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(
    value,
  );
}
