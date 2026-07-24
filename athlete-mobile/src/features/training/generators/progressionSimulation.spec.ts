/**
 * Example test for the persona-driven progression simulator (p2 × MAX_KRAFT).
 * It proves the framework runs end-to-end against the real generator and
 * asserts the intra-session invariants.
 *
 * The golden-comparison tests are skipped: the tables under `__golden__/` now
 * encode the target values from
 * docs/specs/max-weight-training-progression-logic.md, which the current
 * generator does not produce yet. Drop the `.skip` once the generator
 * implements the spec.
 */
import fs from "node:fs";
import path from "node:path";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
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
import {
  personaToUser,
  type LegacyPersona,
} from "../../../../test/simulation/progression/personaAdapter";
import {
  simulateProgression,
  type SessionSnapshot,
} from "../../../../test/simulation/progression/progressionSimulator";

// Legacy persona assets are untyped `.js`; cast at the boundary. p2 is tagged
// LEVEL_ADVANCED, matching the spec's restriction of max strength training to
// the Advanced/Pro levels.
const personaP2 = (
  require("../../../../assets/data/personas/p2.js") as {
    default: LegacyPersona;
  }
).default;

const exerciseById = (id: string): ExerciseType => {
  const found = (ExercisesData as ExerciseType[]).find((e) => e.id === id);
  if (!found) throw new Error(`Exercise ${id} missing from Exercises.json`);
  return found;
};

// Barbell back squat (Kniebeuge mit LH Max-K) — the exercise from the bug report.
const squat = exerciseById("26");

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
  return simulateProgression(personaP2, squat, "MAX_KRAFT", {
    sessions: 4,
    feedback,
    maxValues,
  });
}

describe("progressionSimulation: p2 × MAX_KRAFT", () => {
  const results = new Map<string, SessionSnapshot[]>();

  beforeAll(() => {
    for (const { name, feedback } of RUNS) results.set(name, run(feedback));
  });

  // Skipped: the goldens now encode the spec-target values (see
  // __golden__/README.md), which the current generator does not produce yet.
  it.skip.each(RUNS)(
    "$name: matches the committed progression golden",
    ({ name }) => {
      assertGolden(
        `p2-max-strength.${name}.progression.md`,
        serializeProgression(results.get(name)!),
      );
    },
  );

  it.skip.each(RUNS)("$name: matches the committed sets golden", ({ name }) => {
    assertGolden(
      `p2-max-strength.${name}.sets.md`,
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

  // INV1 held only for ADVANCED personas; BEGINNER reps fell through to a
  // weight-based fallback that made reps rise with weight. With p2 (ADVANCED)
  // the rep table applies, so this is a plain regression guard.
  it("INV1 working set reps never increase across a session", () => {
    const reps = workingSets(results.get("tooEasy")![0]).map((s) => s.reps);
    for (let i = 1; i < reps.length; i++) {
      expect(reps[i]).toBeLessThanOrEqual(reps[i - 1]);
    }
  });

  // Spec section 2: warm-up loads derive from the 1st working set (50% / 75%)
  // and must therefore be present and ascending.
  it.each(RUNS)(
    "$name: warm-up sets carry loads derived from the first working set",
    ({ name }) => {
      for (const session of results.get(name)!) {
        const warmups = session.exercises[0].sets.filter((s) => s.isWarmup);
        expect(warmups.map((s) => s.percentage)).toEqual([50, 75]);
        const loads = warmups.map((s) => s.weightKg);
        for (const load of loads) {
          expect(load).toBeGreaterThan(0);
        }
        expect(loads[0]!).toBeLessThan(loads[1]!);
      }
    },
  );
});

// The simulator reconstructs sets from the generator's building blocks, while
// production assembles them in getSetListFromExercisePairs. This guards the
// two paths against drifting apart.
describe("progressionSimulation: simulator aligns with production set list assembly", () => {
  it("main exercise sets from getSetListFromExercisePairs match the simulator snapshot", () => {
    const generator = new TrainingGenerator();
    const user = personaToUser(personaP2, maxValues);

    // A bodyweight SUPPORT exercise must be in the pool: production fills the
    // pauses between working sets with support exercises and throws if none
    // clears the equipment filter.
    const setList = generator.getSetListFromExercisePairs(
      [
        {
          first: {
            branchId: "alignment-test-branch",
            branchTags: [],
            exerciseId: squat.id,
          },
        },
      ],
      { skill: "MAX_KRAFT", length: 0 },
      {},
      user,
      "HOME",
      [],
      [squat, exerciseById("137")],
      3,
      [],
      {},
    );

    const sets = simulateProgression(personaP2, squat, "MAX_KRAFT", {
      sessions: 1,
      feedback: alwaysSucceeded,
      maxValues,
    })[0]!.exercises[0].sets;

    const squatEntries = setList.filter((e) => e.exerciseId === squat.id);
    expect(squatEntries.map((e) => e.weight)).toEqual(
      sets.map((s) => s.weightKg),
    );
    expect(squatEntries.map((e) => e.repetition)).toEqual(
      sets.map((s) => s.reps),
    );

    // Warm-up rest: the entry right after each warm-up squat entry is its
    // pause. Working set rests are out of scope: production interleaves
    // support exercises there, which the simulator intentionally omits.
    sets
      .filter((s) => s.isWarmup)
      .forEach((warmup, i) => {
        const pauseEntry = setList[setList.indexOf(squatEntries[i]!) + 1];
        expect(pauseEntry?.duration).toBe(warmup.pauseSeconds);
      });
  });
});
