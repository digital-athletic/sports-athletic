import { WorkoutConstants } from "@/constants/workoutConstants";

const { EQUIPMENT } = WorkoutConstants;

/** One equipment part a branch needs, with the place equipment and the branch context. */
export interface EquipmentPartNeed {
  part: string;
  equipment: readonly string[];
  /** Every equipment part the branch needs, the part itself included. */
  branchParts: readonly string[];
  exerciseIds: readonly string[];
}

// undefined: the check does not apply to the part, and the next check decides
type EquipmentPartCheck = (need: EquipmentPartNeed) => boolean | undefined;

// A part named by a family word, such as TUBE_STRONG, accepts any item of the family
const EQUIPMENT_FAMILIES = [
  [EQUIPMENT.TUBE],
  [EQUIPMENT.MINIBAND],
  [EQUIPMENT.TRACK, EQUIPMENT.AREA],
];

const hasEquipmentContaining = (
  equipment: readonly string[],
  names: readonly string[],
): boolean =>
  equipment.some((item) => names.some((name) => item.includes(name)));

// Medicine ball and dumbbell stand in for each other when the branch needs both
const checkMedicineBallDumbbellSwap: EquipmentPartCheck = ({
  part,
  branchParts,
}) =>
  (part.includes(EQUIPMENT.MEDICINE_BALL) &&
    branchParts.includes(EQUIPMENT.DUMBBELL)) ||
  (part === EQUIPMENT.DUMBBELL &&
    branchParts.some((other) => other.includes(EQUIPMENT.MEDICINE_BALL)))
    ? true
    : undefined;

const checkBarbell: EquipmentPartCheck = ({ part, equipment }) =>
  part === EQUIPMENT.BARBELL
    ? hasEquipmentContaining(equipment, [
        EQUIPMENT.BARBELL,
        EQUIPMENT.BARBELL_MULTIPLE,
      ])
    : undefined;

// A bench stands in for a chair or a low box
const checkChairOrLowBox: EquipmentPartCheck = ({ part, equipment }) =>
  part === EQUIPMENT.CHAIR || part === EQUIPMENT.BOX_LOW
    ? hasEquipmentContaining(equipment, [
        EQUIPMENT.BENCH,
        EQUIPMENT.CHAIR,
        EQUIPMENT.BOX_LOW,
      ])
    : undefined;

const isOnlyInclineBenchNeeded = ({ part, branchParts }: EquipmentPartNeed) =>
  part === EQUIPMENT.INCLINE_BENCH &&
  branchParts
    .filter((other) => other.includes(EQUIPMENT.BENCH))
    .every(
      (bench) =>
        bench === EQUIPMENT.INCLINE_BENCH ||
        bench === EQUIPMENT.ADJUSTABLE_BENCH,
    );

const checkExercisingBench: EquipmentPartCheck = ({ part, equipment }) =>
  part === EQUIPMENT.EXERCISING_BENCH ||
  part === EQUIPMENT.MULTIPLE_EXERCISING_BENCHES
    ? hasEquipmentContaining(equipment, [part])
    : undefined;

const checkBench: EquipmentPartCheck = (need) => {
  const { part, equipment, branchParts, exerciseIds } = need;
  if (!part.includes(EQUIPMENT.BENCH)) {
    return undefined;
  }
  if (isOnlyInclineBenchNeeded(need)) {
    return (
      equipment.includes(EQUIPMENT.INCLINE_BENCH) ||
      equipment.includes(EQUIPMENT.ADJUSTABLE_BENCH)
    );
  }
  if (
    exerciseIds.some((id) =>
      WorkoutConstants.EXERCISING_BENCH_EXERCISES.includes(id),
    )
  ) {
    return checkExercisingBench(need);
  }
  // A chair the place has and the branch needs replaces every other bench
  if (
    hasEquipmentContaining(equipment, [EQUIPMENT.CHAIR]) &&
    branchParts.includes(EQUIPMENT.CHAIR)
  ) {
    return true;
  }
  return hasEquipmentContaining(equipment, [EQUIPMENT.BENCH]);
};

const checkEquipmentFamily: EquipmentPartCheck = ({ part, equipment }) => {
  const family = EQUIPMENT_FAMILIES.find((names) =>
    names.some((name) => part.includes(name)),
  );
  return family === undefined
    ? undefined
    : hasEquipmentContaining(equipment, family);
};

const checkMedicineBall: EquipmentPartCheck = ({ part, equipment }) =>
  part === EQUIPMENT.MEDICINE_BALL
    ? hasEquipmentContaining(equipment, [EQUIPMENT.MEDICINE_BALL])
    : undefined;

// The treadmill always counts as available
const checkTreadmill: EquipmentPartCheck = ({ part }) =>
  part === EQUIPMENT.TREADMILL ? true : undefined;

const EQUIPMENT_PART_CHECKS: EquipmentPartCheck[] = [
  checkMedicineBallDumbbellSwap,
  checkBarbell,
  checkChairOrLowBox,
  checkBench,
  checkEquipmentFamily,
  checkMedicineBall,
  checkTreadmill,
];

/**
 * Checks whether the place has an equipment part or an item that stands in
 * for it. The first check that applies decides; otherwise the place must list
 * the part itself.
 *
 * isEquipmentPartAvailable({ part: "CHAIR", equipment: ["BENCH"], branchParts: [], exerciseIds: [] }) → true
 */
export const isEquipmentPartAvailable = (need: EquipmentPartNeed): boolean => {
  for (const check of EQUIPMENT_PART_CHECKS) {
    const available = check(need);
    if (available !== undefined) {
      return available;
    }
  }
  return need.equipment.includes(need.part);
};
