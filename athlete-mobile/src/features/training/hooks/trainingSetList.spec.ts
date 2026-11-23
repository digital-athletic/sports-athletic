import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import {
  generateSetList,
  selectWorkout,
  type WorkoutGenerationRequest,
  type WorkoutSelection,
} from "@/features/training/workoutGeneratorRouter";
import type { Template } from "@/schemas/aiwl.schema";
import { generateAthlete } from "@test/factories/athlete";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { generateTrainingSetList } from "./trainingSetList";
import { generateSetListResult } from "@test/factories/setListResult";
import { hashTemplateBlocks } from "@/features/customWorkouts/drawnWorkout";

jest.mock("@/features/training/workoutGeneratorRouter", () => ({
  selectWorkout: jest.fn(),
  generateSetList: jest.fn(),
}));

const mockGenerateSetList = jest.mocked(generateSetList);
const mockSelectWorkout = jest.mocked(selectWorkout);

/**
 * Builds the request of a training start at the studio. The overrides
 * replace any field.
 *
 * generateRequest({ type: "custom-a" })
 * → { type: "custom-a", place: "STUDIO", user: <advanced athlete>, exercises: [], ... }
 */
const generateRequest = (
  overrides: Partial<WorkoutGenerationRequest> = {},
): WorkoutGenerationRequest & { place: "STUDIO" } => ({
  type: "custom-a",
  user: generateAthlete(),
  exercises: [],
  skillTrees: {},
  weekday: 1,
  equipment: [],
  givenSection: undefined,
  daysSinceLastWorkout: 0,
  userExerciseData: { exerciseData: {}, branchData: {} },
  ...overrides,
  place: "STUDIO",
});

/**
 * Stores the template as the own training "custom-a".
 *
 * generateWorkoutsById(template)
 * → { "custom-a": { id: "custom-a", teamId: null, template, importedAt: 0 } }
 */
const generateWorkoutsById = (template: Template) => ({
  "custom-a": { id: "custom-a", teamId: null, template, importedAt: 0 },
});

/**
 * Builds the selection the router makes for a custom workout template.
 *
 * generateSelection(template)
 * → { workout: template, lookUpBranch: lookUpStoredBranchInCatalog, filters: {} }
 */
const generateSelection = (template: Template): WorkoutSelection => ({
  workout: template,
  lookUpBranch: lookUpStoredBranchInCatalog,
  filters: {},
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGenerateSetList.mockReturnValue({ setList: [], blocks: [] });
});

describe("trainingSetList: generateTrainingSetList", () => {
  it("saves the first set list of a custom workout at the place", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const saveDrawnWorkout = jest.fn();
    mockSelectWorkout.mockReturnValue(generateSelection(template));
    mockGenerateSetList.mockReturnValue(generateSetListResult(template, "510"));

    const setList = generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template),
        drawnWorkouts: {},
        drawnWorkoutsHydrated: true,
        saveDrawnWorkout,
      },
      () => Math.random(),
      generateRequest(),
    );

    expect(setList.map(({ branchId }) => branchId)).toEqual(["510"]);
    expect(saveDrawnWorkout).toHaveBeenCalledWith("custom-a", "STUDIO", {
      templateHash: hashTemplateBlocks(template.blocks),
      workout: {
        ...template,
        blocks: [
          {
            kind: "branches",
            skill: "GKS",
            branches: ["510"],
            pickedFrom: { picks: [{ tags: [], count: 1 }] },
          },
        ],
      },
    });
  });

  it("replays the drawn workout of the place and saves nothing when a blocked branch was replaced", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const drawnWorkout = {
      templateHash: hashTemplateBlocks(template.blocks),
      workout: {
        ...template,
        blocks: [
          generateBranchesBlock("GKS", ["523"], {
            pickedFrom: { picks: [{ tags: [], count: 1 }] },
          }),
        ],
      },
    };
    const saveDrawnWorkout = jest.fn();
    // The mocked generator returns 518, as a replay that replaced the blocked 523.
    mockSelectWorkout.mockReturnValue(generateSelection(template));
    mockGenerateSetList.mockReturnValue(generateSetListResult(template, "518"));

    generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template),
        drawnWorkouts: {
          "custom-a": {
            STUDIO: drawnWorkout,
          },
        },
        drawnWorkoutsHydrated: true,
        saveDrawnWorkout,
      },
      () => Math.random(),
      generateRequest(),
    );

    expect(mockGenerateSetList.mock.calls[0][0].workout).toBe(
      drawnWorkout.workout,
    );
    expect(saveDrawnWorkout).not.toHaveBeenCalled();
  });

  it("starts fresh and saves nothing before the drawn workouts store hydrates", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const saveDrawnWorkout = jest.fn();
    mockSelectWorkout.mockReturnValue(generateSelection(template));

    generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template),
        drawnWorkouts: {},
        drawnWorkoutsHydrated: false,
        saveDrawnWorkout,
      },
      () => Math.random(),
      generateRequest(),
    );

    expect(mockSelectWorkout).toHaveBeenCalledTimes(1);
    expect(mockGenerateSetList).toHaveBeenCalledTimes(1);
    expect(mockGenerateSetList.mock.calls[0][0].workout).toBe(template);
    expect(saveDrawnWorkout).not.toHaveBeenCalled();
  });

  it.each(["MOB", "PLAN", "TEST_WORKOUT"])(
    "saves nothing for the bundled type %s",
    (type) => {
      const saveDrawnWorkout = jest.fn();

      generateTrainingSetList(
        {
          workoutsById: {},
          drawnWorkouts: {},
          drawnWorkoutsHydrated: true,
          saveDrawnWorkout,
        },
        () => Math.random(),
        generateRequest({ type }),
      );

      expect(mockSelectWorkout).toHaveBeenCalledTimes(1);
      expect(mockGenerateSetList).toHaveBeenCalledTimes(1);
      expect(saveDrawnWorkout).not.toHaveBeenCalled();
    },
  );
});
