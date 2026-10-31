/** Estimates the seconds of a skill for an exercise count and its table minutes. */
export type SkillSecondsEstimate = (
  skill: string,
  exerciseCount: number,
  minutes: number,
) => number;

/** The steps of one skill in ascending order, and its cap. */
export interface SkillSteps {
  skill: string;
  steps: { minutes: number; exerciseCount: number }[];
  maxMinutes: number;
}

/** The step the draw gives a skill and the minutes of that step. */
export interface SkillDraw {
  skill: string;
  stepIndex: number;
  stepMinutes: number;
}

// Ties go to the smaller step, as in the old minute allocation.
const findNearestStep = (stepSeconds: number[], seconds: number): number =>
  stepSeconds.reduce(
    (nearest, candidate, index) =>
      Math.abs(candidate - seconds) < Math.abs(stepSeconds[nearest] - seconds)
        ? index
        : nearest,
    0,
  );

/**
 * Shares out the minutes of a training day like the old minute allocation of
 * `PlanGenerator`, in estimated minutes instead of table minutes:
 *
 * 1. Every skill gets the estimate of its smallest step.
 * 2. The `fillFirst` skill gets the leftover minutes up to its cap.
 * 3. Each skill in priority order gets the leftover minutes up to its cap.
 * 4. Every skill takes the step whose estimate lies nearest to its minutes,
 *    so the day can end above the budget.
 *
 * drawTrainingDay({ skills: [{ skill: "MAX", steps: [{ minutes: 10, exerciseCount: 1 }], maxMinutes: 10 }], budgetMinutes: 30 }, estimate)
 * → [{ skill: "MAX", stepIndex: 0, stepMinutes: 10 }]
 */
export const drawTrainingDay = (
  {
    skills,
    budgetMinutes,
    fillFirst,
  }: { skills: SkillSteps[]; budgetMinutes: number; fillFirst?: string },
  estimate: SkillSecondsEstimate,
): SkillDraw[] => {
  const drawable = skills.filter(({ steps }) => steps.length > 0);
  const stepSeconds = drawable.map(({ skill, steps }) =>
    steps.map(({ minutes, exerciseCount }) =>
      estimate(skill, exerciseCount, minutes),
    ),
  );
  const skillSeconds = stepSeconds.map(([smallest]) => smallest);
  let leftSeconds =
    budgetMinutes * 60 - skillSeconds.reduce((total, s) => total + s, 0);
  const addLeftover = (index: number) => {
    const added = Math.min(
      leftSeconds,
      drawable[index].maxMinutes * 60 - skillSeconds[index],
    );
    skillSeconds[index] += added;
    leftSeconds -= added;
  };

  if (leftSeconds > 0) {
    const fillFirstIndex = drawable.findIndex(
      ({ skill }) => skill === fillFirst,
    );
    if (fillFirstIndex >= 0) addLeftover(fillFirstIndex);
    for (const index of drawable.keys()) {
      if (leftSeconds <= 0) break;
      addLeftover(index);
    }
  }

  return drawable.map(({ skill, steps }, index) => {
    const stepIndex = findNearestStep(stepSeconds[index], skillSeconds[index]);
    return { skill, stepIndex, stepMinutes: steps[stepIndex].minutes };
  });
};
