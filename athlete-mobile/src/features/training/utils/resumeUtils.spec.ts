import type { ActiveTrainingType } from "../models/ActiveTraining";
import type { TrainingTimeType } from "../models/Training";
import { hasStaleLeftovers, isResumableSession } from "./resumeUtils";

const makeActiveTraining = (
  overrides: Partial<ActiveTrainingType> = {},
): ActiveTrainingType => ({
  id: "training-1",
  type: "PLAN",
  ...overrides,
});

const makeTime = (
  overrides: Partial<TrainingTimeType> = {},
): TrainingTimeType => ({
  start: undefined,
  end: undefined,
  pause: 0,
  skill: {
    PREVENTION: 0,
    MOBILITY: 0,
    SWR: 0,
    WARMUP: 0,
    STABILITY: 0,
    CARDIO: 0,
  },
  ...overrides,
});

describe("resumeUtils: isResumableSession", () => {
  it("returns true when activeTraining is set, start is defined, and end is undefined", () => {
    expect(
      isResumableSession(makeActiveTraining(), makeTime({ start: 1000 })),
    ).toBe(true);
  });

  it("returns false when activeTraining is null", () => {
    expect(isResumableSession(null, makeTime({ start: 1000 }))).toBe(false);
  });

  it("returns false when start is undefined (session generated but never started)", () => {
    expect(
      isResumableSession(makeActiveTraining(), makeTime({ start: undefined })),
    ).toBe(false);
  });

  it("returns false when end is defined (session finished or aborted)", () => {
    expect(
      isResumableSession(
        makeActiveTraining(),
        makeTime({ start: 1000, end: 2000 }),
      ),
    ).toBe(false);
  });
});

describe("resumeUtils: hasStaleLeftovers", () => {
  it("returns false when activeTraining is null", () => {
    expect(hasStaleLeftovers(null, makeTime())).toBe(false);
  });

  it("returns false when the session is resumable (no stale leftovers)", () => {
    expect(
      hasStaleLeftovers(makeActiveTraining(), makeTime({ start: 1000 })),
    ).toBe(false);
  });

  it("returns true when activeTraining is set but session was never started", () => {
    expect(
      hasStaleLeftovers(makeActiveTraining(), makeTime({ start: undefined })),
    ).toBe(true);
  });

  it("returns true when activeTraining is set and session has already ended", () => {
    expect(
      hasStaleLeftovers(
        makeActiveTraining(),
        makeTime({ start: 1000, end: 2000 }),
      ),
    ).toBe(true);
  });
});
