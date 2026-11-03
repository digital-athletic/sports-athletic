import {
  generatePlanAthlete,
  generatePlanGenerationInput,
} from "@test/factories/planGenerationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import {
  generateTrainingPlaces,
  generateWeeklySchedule,
} from "@test/factories/weeklySchedule";
import type { PlanGenerationInput } from "./planGenerationInput/planGenerationInput";
import {
  type SkillBranchSelection,
  selectDayBranches,
} from "./stages/branchSelection";
import { assignTrainingDayFocus } from "./stages/dayGroupingAndFocus";
import { deriveAthleteProfile } from "./stages/profileDerivation";
import { selectRegionConfiguration } from "./stages/regionConfiguration";
import { layOutSections } from "./stages/sectionLayout";
import { budgetSectionDays } from "./stages/skillBudget";

const SEED = 20261102;

// Formats one skill of a day as "<skill> <minutes> min: <branch ids>".
const formatSelection = (
  selection: SkillBranchSelection,
  skillMinutes: number,
): string => {
  const branchIds =
    selection.type === "BRANCHES"
      ? selection.branches.map(({ branchId }) => branchId).join(",")
      : "empty";
  return `${selection.skill} ${skillMinutes} min: ${branchIds}`;
};

// Runs every stage in plan order and lists each section with the skills,
// minutes and branches of each of its days.
const generatePlanOutline = (input: PlanGenerationInput): string[] => {
  const profile = deriveAthleteProfile(input);
  const days = assignTrainingDayFocus(input, profile).flat();
  const { authoredData, trainingPlaces } = input;
  return layOutSections(profile, authoredData.sectionTemplates).flatMap(
    (section) => [
      `${section.type} ${section.numOfWeeks} weeks ${section.cardioType}`,
      ...budgetSectionDays(
        { section, profile, trainingPlaces, authoredData },
        days,
      ).flatMap(({ day, skills }) => {
        const { selections } = selectDayBranches(
          skills.map(({ skill, minutes }) => ({
            skill,
            tagEntries: selectRegionConfiguration(
              skill,
              minutes,
              profile,
              authoredData.regionConfigs,
            ).tagEntries,
          })),
          day.place,
          profile,
          input,
        );
        return [
          `  day ${day.weekday} ${day.place} ${day.duration} min ${day.focus}`,
          ...selections.map(
            (selection, index) =>
              `    ${formatSelection(selection, skills[index].minutes)}`,
          ),
        ];
      }),
    ],
  );
};

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
    "a professional adult over a 26-week preparatory phase",
    {
      athlete: generatePlanAthlete({ tags: { LEVEL: ["PROFESSIONAL"] } }),
      seasonPhase: { type: "PREPARATORY", endDate: "2027-05-03" },
    },
  ],
];

describe("the plan generator stages for a seeded random source", () => {
  it.each(CASES)("generate the same plan for %s", (_, overrides) => {
    const input = generatePlanGenerationInput({
      ...overrides,
      random: generateSeededRandom(SEED),
    });

    expect(generatePlanOutline(input)).toMatchSnapshot();
  });
});
