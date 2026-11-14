import {
  type SportTest,
  type SportTestReferenceValue,
} from "@/features/performanceTests/models/SportTest";
import { supabase } from "./supabaseClient";

export const SPORT_TEST_REGION = "DE";

interface SportTestReferenceValueRow {
  gender: string;
  position: string;
  training_stage: string;
  // Postgres numeric can arrive as a string.
  range_start: number | string;
  range_end: number | string;
}

interface SportTestRow {
  id: string;
  sport: string;
  code: string;
  unit: string;
  sport_test_reference_values: SportTestReferenceValueRow[];
}

type Gender = SportTestReferenceValue["gender"];

/** Imported rows vary in case and padding; the app compares upper case codes. */
function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function isGender(value: string): value is Gender {
  return value === "MALE" || value === "FEMALE";
}

function toReferenceValues(
  rows: SportTestReferenceValueRow[],
): SportTestReferenceValue[] {
  return rows.flatMap((row) => {
    const gender = normalizeCode(row.gender);
    if (!isGender(gender)) return [];

    return [
      {
        gender,
        position: normalizeCode(row.position),
        trainingStage: normalizeCode(row.training_stage),
        rangeStart: Number(row.range_start),
        rangeEnd: Number(row.range_end),
      },
    ];
  });
}

function toSportTest(row: SportTestRow): SportTest {
  return {
    id: row.id,
    code: normalizeCode(row.code),
    unit: row.unit.trim(),
    referenceValues: toReferenceValues(row.sport_test_reference_values),
  };
}

/** Rejects when the read fails, so callers never mistake a failure for no tests. */
export async function fetchSportTests(
  sport: string,
  region: string = SPORT_TEST_REGION,
): Promise<SportTest[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = (await supabase
    .from("sport_tests")
    .select(
      "id, sport, code, unit, sport_test_reference_values(gender, position, training_stage, range_start, range_end)",
    )
    .eq("region", region)
    .order("code")) as {
    data: SportTestRow[] | null;
    error: { message: string } | null;
  };

  if (error) throw new Error(error.message);
  if (!data) throw new Error("sport_tests read returned no data");

  // The sport is matched here, because the query compares it case sensitively.
  return data
    .filter((row) => normalizeCode(row.sport) === normalizeCode(sport))
    .map(toSportTest);
}
