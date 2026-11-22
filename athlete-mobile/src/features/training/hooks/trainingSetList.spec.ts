import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { FinishedWorkout } from "@/features/training/workoutGenerator/stages/workoutFinish";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import {
  generateSetList,
  selectWorkout,
  type WorkoutGenerationRequest,
  type WorkoutSelection,
} from "@/features/training/workoutGeneratorRouter";
import type { Template } from "@/schemas/aiwl.schema";
import { generateAthlete } from "@test/factories/athlete";
import { generateFilledBlockResult } from "@test/factories/blockResult";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { generateTrainingSetList } from "./trainingSetList";

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

/**
 * Builds what the generator returns when the GKS block of the template drew
 * the branch.
 *
 * generateFinishedWorkout(template, "510")
 * → { blocks: [<filled GKS result of 510>], setList: [{ branchId: "510", exerciseId: "exercise510", set: [1, 1], skill: "GKS" }] }
 */
const generateFinishedWorkout = (
  template: Template,
  branchId: string,
): FinishedWorkout<GeneratedSetListEntry> => ({
  blocks: [generateFilledBlockResult(template.blocks[0], [branchId])],
  setList: [
    { branchId, exerciseId: `exercise${branchId}`, set: [1, 1], skill: "GKS" },
  ],
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGenerateSetList.mockReturnValue({ setList: [], blocks: [] });
});

describe("trainingSetList: generateTrainingSetList", () => {
  it("saves the first set list of a custom workout at the place", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const saveVersion = jest.fn();
    mockSelectWorkout.mockReturnValue(generateSelection(template));
    mockGenerateSetList.mockReturnValue(
      generateFinishedWorkout(template, "510"),
    );

    const setList = generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template),
        versionsByWorkout: {},
        versionsHydrated: true,
        saveVersion,
      },
      () => Math.random(),
      generateRequest(),
    );

    expect(setList.map(({ branchId }) => branchId)).toEqual(["510"]);
    expect(saveVersion).toHaveBeenCalledWith("custom-a", "STUDIO", {
      templateBlocks: JSON.stringify(template.blocks),
      blocks: [
        {
          block: { kind: "branches", skill: "GKS", branches: ["510"] },
          templateIndex: 0,
        },
      ],
    });
  });

  it("replays the saved version of the place and saves nothing when a blocked branch was replaced", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const savedBlocks = [
      { block: generateBranchesBlock("GKS", ["523"]), templateIndex: 0 },
    ];
    const saveVersion = jest.fn();
    // A pain blocks branch 523, so the replay draws 518 in its slot.
    mockSelectWorkout.mockReturnValue(generateSelection(template));
    mockGenerateSetList.mockReturnValue(
      generateFinishedWorkout(template, "518"),
    );

    generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template),
        versionsByWorkout: {
          "custom-a": {
            STUDIO: {
              templateBlocks: JSON.stringify(template.blocks),
              blocks: savedBlocks,
            },
          },
        },
        versionsHydrated: true,
        saveVersion,
      },
      () => Math.random(),
      generateRequest(),
    );

    expect(mockGenerateSetList.mock.calls[0][2].previousDrawnBlocks).toEqual(
      savedBlocks,
    );
    expect(saveVersion).not.toHaveBeenCalled();
  });

  it("starts fresh and saves nothing before the versions store hydrates", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const saveVersion = jest.fn();

    generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template),
        versionsByWorkout: {},
        versionsHydrated: false,
        saveVersion,
      },
      () => Math.random(),
      generateRequest(),
    );

    expect(mockSelectWorkout).toHaveBeenCalledTimes(1);
    expect(mockGenerateSetList).toHaveBeenCalledTimes(1);
    expect(
      mockGenerateSetList.mock.calls[0][2].previousDrawnBlocks,
    ).toBeUndefined();
    expect(saveVersion).not.toHaveBeenCalled();
  });

  it.each(["MOB", "PLAN", "TEST_WORKOUT"])(
    "saves nothing for the bundled type %s",
    (type) => {
      const saveVersion = jest.fn();

      generateTrainingSetList(
        {
          workoutsById: {},
          versionsByWorkout: {},
          versionsHydrated: true,
          saveVersion,
        },
        () => Math.random(),
        generateRequest({ type }),
      );

      expect(mockSelectWorkout).toHaveBeenCalledTimes(1);
      expect(mockGenerateSetList).toHaveBeenCalledTimes(1);
      expect(
        mockGenerateSetList.mock.calls[0][2].previousDrawnBlocks,
      ).toBeUndefined();
      expect(saveVersion).not.toHaveBeenCalled();
    },
  );
});
