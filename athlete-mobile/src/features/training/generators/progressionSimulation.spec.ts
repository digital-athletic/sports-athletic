/**
 * Example test for the persona-driven progression simulator (p1 × MAX_KRAFT).
 * It proves the framework runs end-to-end against the real generator, compares
 * the output against the committed golden tables, and asserts the intra-session
 * invariants. INV1 is intentionally red: it encodes a known defect (working set
 * reps rise together with weight instead of falling) and flips to a regression
 * guard once that defect is fixed.
 */
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_MAX_VALUE,
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";
import type { ExerciseType } from "@/schemas/exercise.schema";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import {
  alwaysSucceeded,
  alwaysTooEasy,
  alwaysTooHard,
  type FeedbackScript,
} from "../../../../test/simulation/progression/feedbackScripts";
import {
  serializeProgression,
  serializeSets,
} from "../../../../test/simulation/progression/goldenTable";
import type { LegacyPersona } from "../../../../test/simulation/progression/personaAdapter";
import {
  simulateProgression,
  type SessionSnapshot,
} from "../../../../test/simulation/progression/progressionSimulator";

// Legacy persona assets are untyped `.js`; cast at the boundary.
const personaP1 = (
  require("../../../../assets/data/personas/p1.js") as {
    default: LegacyPersona;
  }
).default;

// Barbell back squat (Kniebeuge mit LH Max-K) — the exercise from the bug report.
const SQUAT_ID = "26";
const squat = ((): ExerciseType => {
  const found = (ExercisesData as ExerciseType[]).find(
    (e) => e.id === SQUAT_ID,
  );
  if (!found)
    throw new Error(`Exercise ${SQUAT_ID} missing from Exercises.json`);
  return found;
})();

// Seed the squat 1RM (kneeDominant/barbell) from the bug report so kg are real.
const maxValues: MaxValuesType = {
  ...DEFAULT_MAX_VALUES,
  kneeDominant: { ...DEFAULT_MAX_VALUE, barbell: 121 },
};

const goldenDir = path.resolve(
  __dirname,
  "../../../../test/simulation/progression/__golden__",
);

function assertGolden(file: string, actual: string) {
  const goldenPath = path.join(goldenDir, file);
  if (process.env.UPDATE_GOLDEN) {
    if (process.env.CI) {
      throw new Error("UPDATE_GOLDEN must not be set in CI");
    }
    fs.writeFileSync(goldenPath, actual);
  }
  if (!fs.existsSync(goldenPath)) {
    throw new Error(
      `Missing golden ${file}; regenerate with UPDATE_GOLDEN=1 (see __golden__/README.md)`,
    );
  }
  expect(actual).toBe(fs.readFileSync(goldenPath, "utf8"));
}

const workingSets = (session: SessionSnapshot) =>
  session.exercises[0].sets.filter((s) => !s.isWarmup);

const RUNS: { name: string; feedback: FeedbackScript }[] = [
  { name: "tooEasy", feedback: alwaysTooEasy },
  { name: "succeeded", feedback: alwaysSucceeded },
  { name: "tooHard", feedback: alwaysTooHard },
];

function run(feedback: FeedbackScript): SessionSnapshot[] {
  return simulateProgression(personaP1, squat, "MAX_KRAFT", {
    sessions: 4,
    feedback,
    maxValues,
  });
}

describe("progressionSimulation: p1 × MAX_KRAFT", () => {
  const results = new Map<string, SessionSnapshot[]>();

  beforeAll(() => {
    for (const { name, feedback } of RUNS) results.set(name, run(feedback));
  });

  it.each(RUNS)(
    "$name: matches the committed progression golden",
    ({ name }) => {
      assertGolden(
        `p1-max-strength.${name}.progression.md`,
        serializeProgression(results.get(name)!),
      );
    },
  );

  it.each(RUNS)("$name: matches the committed sets golden", ({ name }) => {
    assertGolden(
      `p1-max-strength.${name}.sets.md`,
      serializeSets(results.get(name)!),
    );
  });

  it("runs four sessions and records working set weights and reps", () => {
    const sessions = results.get("tooEasy")!;
    expect(sessions).toHaveLength(4);
    for (const session of sessions) {
      const working = workingSets(session);
      expect(working.length).toBeGreaterThan(0);
      for (const set of working) {
        expect(typeof set.weightKg).toBe("number");
        expect(set.reps).toBeGreaterThan(0);
      }
    }
  });

  // INV2 is intra-session (weight ascends across sets within one session), so it
  // holds regardless of feedback — checked across all three runs.
  it.each(RUNS)(
    "$name: INV2 working set weight never decreases across a session",
    ({ name }) => {
      for (const session of results.get(name)!) {
        const percentages = workingSets(session).map((s) => s.percentage ?? 0);
        for (let i = 1; i < percentages.length; i++) {
          expect(percentages[i]).toBeGreaterThanOrEqual(percentages[i - 1]);
        }
      }
    },
  );

  // INV1 is expected to fail against current code: BEGINNER reps fall through
  // to a weight-based fallback, so reps rise as weight rises. `it.failing`
  // keeps the suite green while the defect stands and turns red the moment it
  // is fixed, prompting removal of `.failing`. The committed golden table shows
  // the offending per set reps.
  it.failing("INV1 working set reps never increase across a session", () => {
    const reps = workingSets(results.get("tooEasy")![0]).map((s) => s.reps);
    for (let i = 1; i < reps.length; i++) {
      expect(reps[i]).toBeLessThanOrEqual(reps[i - 1]);
    }
  });
});
