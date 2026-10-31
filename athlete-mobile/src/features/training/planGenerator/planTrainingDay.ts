import type { LevelTag } from "@/constants/workoutConstants";
import { loadMaxMinutes } from "@/data/loadMaxMinutes";
import { readSkillSetListKind } from "@/features/training/workoutGenerator/stages/setListBuilding";
import type { MaxMinutes, MaxMinutesGroup } from "@/schemas/generator.schema";
import { readSkillEstimate, type SkillEstimate } from "./durationEstimate";
import { drawTrainingDay } from "./trainingDayDraw";

/** A skill of a training day and its minimum minutes from the section. */
interface TrainingDaySkill {
  skill: string;
  minMinutes: number;
}

/** The skills of a training day in priority order and the day's frame. */
interface PlanTrainingDayInput {
  skills: TrainingDaySkill[];
  durationMinutes: number;
  level: LevelTag;
  fillFirst?: string;
}

/** The exercise count of a skill and its estimated seconds. Cardio has whole minutes and no exercise count. */
export interface SkillPlan {
  skill: string;
  seconds: number;
  exerciseCount?: number;
}

// maxMinutes.json sets 0 for a level without a cap; the planner then caps the skill at 200 minutes.
export const UNCAPPED_MINUTES = 200;

const isMaxMinutesGroup = (
  maxMinutes: MaxMinutes,
  name: string,
): name is MaxMinutesGroup => Object.hasOwn(maxMinutes, name);

/**
 * Returns the cap of a skill from its maxMinutes.json group. A KG skill shares
 * the group of its weighted skill, every PREV and SWR skill its prefix group.
 *
 * readMaxMinutes("PREVKNEE", "ADVANCED") → 15
 */
export const readMaxMinutes = (skill: string, level: LevelTag): number => {
  const maxMinutes = loadMaxMinutes();
  const kind = readSkillSetListKind(skill);
  const name = skill.replace(/KG$/, "");
  const group: MaxMinutesGroup =
    kind === "cardio"
      ? "CARDIO"
      : kind === "maxStrength"
        ? "MAX"
        : name.startsWith("PREV")
          ? "PREV"
          : name.startsWith("SWR")
            ? "SWR"
            : isMaxMinutesGroup(maxMinutes, name)
              ? name
              : "DEFAULT";
  return maxMinutes[group][level] || UNCAPPED_MINUTES;
};

// Ties go to the smaller count, as in the old minute allocation.
const pickExerciseCount = (
  estimate: SkillEstimate,
  seconds: number,
): number => {
  let count = 1;
  while (
    estimate(count + 1) > estimate(count) &&
    estimate(count + 1) - seconds < seconds - estimate(count)
  ) {
    count += 1;
  }
  return count;
};

/**
 * Plans the exercises of each skill of a training day from estimated seconds:
 *
 * 1. Every skill starts with its minimum minutes, or with the estimate of one
 *    exercise when that takes longer.
 * 2. `drawTrainingDay` shares out the leftover seconds up to each skill's cap.
 * 3. Every skill takes the exercise count whose estimate lies nearest to its
 *    share, so the day can end above or below its duration. Cardio takes the
 *    whole minutes of its share.
 *
 * planTrainingDay({ skills: [{ skill: "MAX", minMinutes: 15 }], durationMinutes: 40, level: "PROFESSIONAL" })
 * → [{ skill: "MAX", exerciseCount: 2, seconds: 2323.2 }]
 */
export const planTrainingDay = ({
  skills,
  durationMinutes,
  level,
  fillFirst,
}: PlanTrainingDayInput): SkillPlan[] => {
  const planned = skills.filter(
    ({ skill }, index) =>
      skills.findIndex((other) => other.skill === skill) === index,
  );
  const estimates = new Map(
    planned
      .filter(({ skill }) => readSkillSetListKind(skill) !== "cardio")
      .map(({ skill }) => [skill, readSkillEstimate(skill, level)]),
  );
  const shares = drawTrainingDay({
    skills: planned.map(({ skill, minMinutes }) => ({
      skill,
      startSeconds: Math.max(minMinutes * 60, estimates.get(skill)?.(1) ?? 0),
      capSeconds: readMaxMinutes(skill, level) * 60,
    })),
    budgetSeconds: durationMinutes * 60,
    fillFirst,
  });

  return shares.map(({ skill, seconds }) => {
    const estimate = estimates.get(skill);
    if (!estimate) return { skill, seconds: Math.floor(seconds / 60) * 60 };
    const exerciseCount = pickExerciseCount(estimate, seconds);
    return { skill, exerciseCount, seconds: estimate(exerciseCount) };
  });
};
