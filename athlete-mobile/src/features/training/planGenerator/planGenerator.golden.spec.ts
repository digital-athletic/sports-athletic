import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { requireLegacyTraining } from "@/features/training/utils/testFixtures";
import {
  generatePlanAthlete,
  generatePlanGenerationInput,
} from "@test/factories/planGenerationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import {
  generateTrainingPlaces,
  generateWeeklySchedule,
} from "@test/factories/weeklySchedule";
import { generateTrainingPlan } from "./planGeneration";
import type { PlanGenerationInput } from "./planGenerationInput/planGenerationInput";

const SEED = 20261102;

const CASES: readonly (readonly [string, Partial<PlanGenerationInput>])[] = [
  ["an advanced adult field player", {}],
  [
    "a professional adult with knee and shoulder pain",
    {
      athlete: generatePlanAthlete({
        tags: {
          LEVEL: ["PROFESSIONAL"],
          PAIN: ["KNEE_LEFT", "SHOULDER_LEFT"],
          POSITION: ["FIELD"],
        },
      }),
    },
  ],
  [
    "a beginner child with wrist pain",
    {
      athlete: generatePlanAthlete({
        birthday: "2016-03-01",
        tags: { LEVEL: ["BEGINNER"], PAIN: ["WRIST_LEFT"] },
      }),
    },
  ],
  [
    "an advanced adult goalkeeper in the competition phase",
    {
      athlete: generatePlanAthlete({
        tags: { LEVEL: ["ADVANCED"], POSITION: ["GOALKEEPER"] },
      }),
      seasonPhase: { type: "COMPETITION", endDate: "2027-01-25" },
    },
  ],
  [
    "an advanced adult with two studio days and a hall day",
    {
      weeklySchedule: generateWeeklySchedule([
        { weekday: 0, place: "STUDIO", duration: 60 },
        { weekday: 2, place: "STUDIO", duration: 75 },
        { weekday: 4, place: "HALL", duration: 45 },
      ]),
      trainingPlaces: generateTrainingPlaces(["HALL"]),
    },
  ],
  [
    "a professional adult over a 26 week preparatory phase",
    {
      athlete: generatePlanAthlete({ tags: { LEVEL: ["PROFESSIONAL"] } }),
      seasonPhase: { type: "PREPARATORY", endDate: "2027-05-03" },
    },
  ],
];

/**
 * Lists each section of a stored plan with its start, then each training day
 * with the minutes and branch IDs per skill. The level maps of the branch
 * copies repeat the skill trees, so the outline leaves them out.
 *
 * outlineTrainingPlan(plan)
 * → ["plan 2026-11-02", "2026-11-02 SWR1 4 weeks CARDIO_3", "  day 3 PHASE BARBELL",
 *    "    SWR1 35 min: 1009,69,63,66,78", ...]
 */
const outlineTrainingPlan = (plan: TrainingPlanType): string[] => [
  `plan ${plan.start}`,
  ...plan.sections.flatMap((section) => [
    `${section.start} ${section.type} ${section.numOfWeeks} weeks ${section.cardioType}`,
    ...section.trainings.map(requireLegacyTraining).flatMap((training) => {
      const branchesBySkill = new Map(Object.entries(training.skills));
      return [
        `  day ${training.weekday} ${training.focus} ${training.equipment?.join(",")}`,
        ...Object.entries(training.lengths).map(([skill, minutes]) => {
          const branchIds =
            branchesBySkill
              .get(skill)
              ?.map(({ branchId }) => branchId)
              .join(",") ?? "empty";
          return `    ${skill} ${minutes} min: ${branchIds}`;
        }),
      ];
    }),
  ]),
];

describe("generateTrainingPlan: seeded random source", () => {
  it.each(CASES)("generates the same plan for %s", (_, overrides) => {
    const input = generatePlanGenerationInput({
      ...overrides,
      random: generateSeededRandom(SEED),
    });

    expect(outlineTrainingPlan(generateTrainingPlan(input))).toMatchSnapshot();
  });
});

describe("generateTrainingPlan: playing position", () => {
  it("generates the same plan for a goalkeeper and a field player with the same answers", () => {
    const planFor = (position: string) =>
      outlineTrainingPlan(
        generateTrainingPlan(
          generatePlanGenerationInput({
            athlete: generatePlanAthlete({
              tags: { LEVEL: ["ADVANCED"], POSITION: [position] },
            }),
            seasonPhase: { type: "COMPETITION", endDate: "2027-01-25" },
            random: generateSeededRandom(SEED),
          }),
        ),
      );

    expect(planFor("GOALKEEPER")).toEqual(planFor("FIELD"));
  });
});
