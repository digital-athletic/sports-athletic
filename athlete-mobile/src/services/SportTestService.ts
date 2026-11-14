import { type SportTest } from "@/features/performanceTests/models/SportTest";
import { supabase } from "./supabaseClient";

export const SPORT_TEST_REGION = "DE";

interface SportTestReferenceValueRow {
  gender: "MALE" | "FEMALE";
  position: string;
  training_stage: string;
  // Postgres numeric can arrive as a string.
  range_start: number | string;
  range_end: number | string;
}

interface SportTestRow {
  id: string;
  code: string;
  unit: string;
  sport_test_reference_values: SportTestReferenceValueRow[];
}

function toSportTest(row: SportTestRow): SportTest {
  return {
    id: row.id,
    code: row.code,
    unit: row.unit,
    referenceValues: row.sport_test_reference_values.map((value) => ({
      gender: value.gender,
      position: value.position,
      trainingStage: value.training_stage,
      rangeStart: Number(value.range_start),
      rangeEnd: Number(value.range_end),
    })),
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
      "id, code, unit, sport_test_reference_values(gender, position, training_stage, range_start, range_end)",
    )
    .eq("sport", sport)
    .eq("region", region)
    .order("code")) as {
    data: SportTestRow[] | null;
    error: { message: string } | null;
  };

  if (error) throw new Error(error.message);
  if (!data) throw new Error("sport_tests read returned no data");

  return data.map(toSportTest);
}
