import { type Sport } from "@/features/training/models/UserWorkoutData";

export type TrainingStage =
  | "BASISTRAINING"
  | "GRUNDLAGENTRAINING"
  | "AUFBAUTRAINING_1"
  | "AUFBAUTRAINING_2"
  | "ANSCHLUSSTRAINING";

type Gender = "MALE" | "FEMALE";

type AgeBand = { stage: TrainingStage; minAge: number; maxAge: number };

const HANDBALL_BANDS: Record<Gender, AgeBand[]> = {
  FEMALE: [
    { stage: "BASISTRAINING", minAge: 11, maxAge: 12 },
    { stage: "GRUNDLAGENTRAINING", minAge: 13, maxAge: 14 },
    { stage: "AUFBAUTRAINING_1", minAge: 15, maxAge: 16 },
    { stage: "AUFBAUTRAINING_2", minAge: 17, maxAge: 18 },
    { stage: "ANSCHLUSSTRAINING", minAge: 19, maxAge: 20 },
  ],
  MALE: [
    { stage: "BASISTRAINING", minAge: 12, maxAge: 13 },
    { stage: "GRUNDLAGENTRAINING", minAge: 14, maxAge: 15 },
    { stage: "AUFBAUTRAINING_1", minAge: 16, maxAge: 17 },
    { stage: "AUFBAUTRAINING_2", minAge: 18, maxAge: 19 },
    { stage: "ANSCHLUSSTRAINING", minAge: 20, maxAge: 21 },
  ],
};

/** Only handball defines training stages; any other sport has none. */
export function trainingStageFor(
  sport: Sport,
  gender: Gender,
  age: number | null,
): TrainingStage | null {
  if (sport !== "SPORT_HANDBALL") return null;
  if (age === null) return null;

  const band = HANDBALL_BANDS[gender].find(
    ({ minAge, maxAge }) => age >= minAge && age <= maxAge,
  );
  return band ? band.stage : null;
}
