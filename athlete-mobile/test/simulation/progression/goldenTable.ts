/**
 * Serializes a progression run into deterministic value tables, one table per
 * file so no section parsing is needed. Output is committed under `__golden__/`
 * and asserted by string equality; human-facing context lives in the folder's
 * README.
 */
import type { SessionSnapshot } from "./progressionSimulator";

/** Blank cell for unknown values (e.g. warm-up loads, last-session level after). */
function cell(value: number | string | null): string {
  return value === null ? "" : String(value);
}

function table(header: string, rows: string[]): string {
  const divider = `|${" --- |".repeat(header.split("|").length - 2)}`;
  return `${[header, divider, ...rows].join("\n")}\n`;
}

/** One row per session: the inter-session weight/level progression. */
export function serializeProgression(sessions: SessionSnapshot[]): string {
  const rows = sessions.flatMap((session) =>
    session.exercises.map(
      (ex) =>
        `| ${session.session} | ${ex.displayName} | ${ex.maxValue} | ${session.focus} | ${cell(ex.weightPercentageBefore)} | ${cell(ex.weightPercentageAfter)} | ${ex.levelBefore} | ${cell(ex.levelAfter)} | ${ex.feedbackGiven ?? ""} | ${ex.feedbackApplied ?? ""} |`,
    ),
  );
  return table(
    "| session | exercise | max kg | focus | weight% before | weight% after | level before | level after | feedback given | feedback applied |",
    rows,
  );
}

/** One row per set: the intra-session weight/rep protocol. */
export function serializeSets(sessions: SessionSnapshot[]): string {
  const rows = sessions.flatMap((session) =>
    session.exercises.flatMap((ex) =>
      ex.sets.map(
        (s) =>
          `| ${session.session} | ${ex.displayName} | ${s.setNumber} | ${s.isWarmup ? "warmup" : "working"} | ${cell(s.percentage)} | ${cell(s.weightKg)} | ${s.reps} | ${s.pauseSeconds} |`,
      ),
    ),
  );
  return table(
    "| session | exercise | set | type | weight% | weight kg | reps | pause s |",
    rows,
  );
}
