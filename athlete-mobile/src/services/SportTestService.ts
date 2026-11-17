import * as v from "valibot";
import {
  type SportTest,
  type SportTestTranslations,
} from "@/features/performanceTests/models/SportTest";
import { supabase } from "./supabaseClient";

export const SPORT_TEST_REGION = "DE";

interface SportTestReferenceValueRow {
  gender: "MALE" | "FEMALE";
  position: string;
  training_stage: string;
  min_age: number;
  max_age: number;
  // Postgres numeric can arrive as a string.
  range_start: number | string;
  range_end: number | string;
}

interface SportTestRow {
  id: string;
  code: string;
  unit: string;
  category: string | null;
  translations: unknown;
  sport_test_reference_values: SportTestReferenceValueRow[];
}

const TranslationSchema = v.object({
  name: v.string(),
  unit: v.optional(v.string()),
});

/**
 * Keeps the well-formed language entries. NULL, a non-object and a malformed
 * entry never fail the read, so one bad translation cannot hide a test.
 */
function parseTranslations(value: unknown): SportTestTranslations {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const translations: SportTestTranslations = {};
  for (const [language, entry] of Object.entries(value)) {
    const parsed = v.safeParse(TranslationSchema, entry);
    if (parsed.success) translations[language] = parsed.output;
  }
  return translations;
}

function toSportTest(row: SportTestRow): SportTest {
  return {
    id: row.id,
    code: row.code,
    unit: row.unit,
    ...(row.category === null ? {} : { category: row.category }),
    translations: parseTranslations(row.translations),
    referenceValues: row.sport_test_reference_values.map((value) => ({
      gender: value.gender,
      position: value.position,
      trainingStage: value.training_stage,
      minAge: value.min_age,
      maxAge: value.max_age,
      rangeStart: Number(value.range_start),
      rangeEnd: Number(value.range_end),
    })),
  };
}

/**
 * Reads the tests of every sport in the region, so athletes of a sport without
 * own tests still see the tests stored for other sports.
 * Rejects when the read fails, so callers never mistake a failure for no tests.
 */
export async function fetchSportTests(
  region: string = SPORT_TEST_REGION,
): Promise<SportTest[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = (await supabase
    .from("sport_tests")
    .select(
      "id, code, unit, category, translations, sport_test_reference_values(gender, position, training_stage, min_age, max_age, range_start, range_end)",
    )
    .eq("region", region)
    .order("code")) as {
    data: SportTestRow[] | null;
    error: { message: string } | null;
  };

  if (error) throw new Error(error.message);
  if (!data) throw new Error("sport_tests read returned no data");

  return data.map(toSportTest);
}
