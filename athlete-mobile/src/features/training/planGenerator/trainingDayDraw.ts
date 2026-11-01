/** The start share and the cap of one skill, in seconds. */
export interface SkillShareFrame {
  skill: string;
  startSeconds: number;
  capSeconds: number;
}

/** The seconds the draw gives a skill. */
export interface SkillShare {
  skill: string;
  seconds: number;
}

/**
 * Shares out the seconds of a training day like the old minute allocation of
 * `PlanGenerator`, in estimated seconds instead of table minutes:
 *
 * 1. Every skill gets its start share.
 * 2. The `fillFirst` skill gets the leftover seconds up to its cap.
 * 3. Each skill in priority order gets the leftover seconds up to its cap.
 *
 * A skill whose start share lies above its cap keeps its start share and takes
 * no leftover seconds.
 *
 * drawTrainingDay({ skills: [{ skill: "MAX", startSeconds: 600, capSeconds: 1200 }], budgetSeconds: 1800 })
 * → [{ skill: "MAX", seconds: 1200 }]
 */
export const drawTrainingDay = ({
  skills,
  budgetSeconds,
  fillFirst,
}: {
  skills: SkillShareFrame[];
  budgetSeconds: number;
  fillFirst?: string;
}): SkillShare[] => {
  const shares = skills.map(({ startSeconds }) => startSeconds);
  let leftSeconds = budgetSeconds - shares.reduce((total, s) => total + s, 0);
  const addLeftover = (index: number) => {
    const added = Math.max(
      0,
      Math.min(leftSeconds, skills[index].capSeconds - shares[index]),
    );
    shares[index] += added;
    leftSeconds -= added;
  };

  const fillFirstIndex = skills.findIndex(({ skill }) => skill === fillFirst);
  if (fillFirstIndex >= 0) addLeftover(fillFirstIndex);
  skills.forEach((_, index) => addLeftover(index));

  return skills.map(({ skill }, index) => ({ skill, seconds: shares[index] }));
};
