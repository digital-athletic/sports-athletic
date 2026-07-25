/**
 * Serializes a progression run into deterministic value tables, one table per
 * file so no section parsing is needed. Output is committed under `__golden__/`
 * and asserted by string equality; human-facing context lives in the folder's
 * README.
 */
import path from "node:path";
import { GoldenDirectory } from "../../goldenDirectory";
import { renderTable, type ColumnSpec } from "../../markdownTable";
import type {
  ExerciseSnapshot,
  SessionSnapshot,
  SetSnapshot,
} from "./progressionSimulator";

export const progressionGoldens = new GoldenDirectory(
  path.join(__dirname, "__golden__"),
);

interface ProgressionRow {
  session: SessionSnapshot;
  exercise: ExerciseSnapshot;
}

interface SetRow {
  session: SessionSnapshot;
  exercise: ExerciseSnapshot;
  set: SetSnapshot;
}

const PROGRESSION_COLUMNS: ColumnSpec<ProgressionRow>[] = [
  { header: "session", value: ({ session }) => session.session },
  { header: "exercise", value: ({ exercise }) => exercise.displayName },
  { header: "max kg", value: ({ exercise }) => exercise.maxValue },
  { header: "focus", value: ({ session }) => session.focus },
  {
    header: "weight% before",
    value: ({ exercise }) => exercise.weightPercentageBefore,
  },
  {
    header: "weight% after",
    value: ({ exercise }) => exercise.weightPercentageAfter,
  },
  { header: "level before", value: ({ exercise }) => exercise.levelBefore },
  { header: "level after", value: ({ exercise }) => exercise.levelAfter },
  { header: "feedback given", value: ({ exercise }) => exercise.feedbackGiven },
  {
    header: "feedback applied",
    value: ({ exercise }) => exercise.feedbackApplied,
  },
  {
    header: "branch level",
    value: ({ exercise }) => exercise.branchLevelChange,
  },
];

const SET_COLUMNS: ColumnSpec<SetRow>[] = [
  { header: "session", value: ({ session }) => session.session },
  { header: "exercise", value: ({ exercise }) => exercise.displayName },
  { header: "set", value: ({ set }) => set.setNumber },
  { header: "type", value: ({ set }) => (set.isWarmup ? "warmup" : "working") },
  { header: "weight%", value: ({ set }) => set.percentage },
  { header: "weight kg", value: ({ set }) => set.weightKg },
  { header: "reps", value: ({ set }) => set.reps },
  { header: "pause s", value: ({ set }) => set.pauseSeconds },
];

/** One row per session: the inter-session weight/level progression. */
export function serializeProgression(sessions: SessionSnapshot[]): string {
  const rows = sessions.flatMap((session) =>
    session.exercises.map((exercise) => ({ session, exercise })),
  );
  return renderTable(PROGRESSION_COLUMNS, rows);
}

/** One row per set: the intra-session weight/rep protocol. */
export function serializeSets(sessions: SessionSnapshot[]): string {
  const rows = sessions.flatMap((session) =>
    session.exercises.flatMap((exercise) =>
      exercise.sets.map((set) => ({ session, exercise, set })),
    ),
  );
  return renderTable(SET_COLUMNS, rows);
}
