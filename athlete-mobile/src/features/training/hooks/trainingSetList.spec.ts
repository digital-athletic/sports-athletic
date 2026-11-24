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
import type { CustomWorkout } from "@/store/customWorkoutsStore";

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

// The last change of the custom workout, as Supabase returns team_workouts.updated_at.
const MODIFIED_AT = "2026-11-01T08:00:00.123456+00:00";

/**
 * Stores the template as the custom workout "custom-a", last changed at
 * MODIFIED_AT. The overrides replace any field.
 *
 * generateWorkoutsById(template, { teamId: "team-1" })
 * → { "custom-a": { id: "custom-a", teamId: "team-1", template, importedAt: 0, modifiedAt: MODIFIED_AT } }
 */
const generateWorkoutsById = (
  template: Template,
  overrides: Partial<CustomWorkout> = {},
): Record<string, CustomWorkout> => ({
  "custom-a": {
    id: "custom-a",
    teamId: null,
    template,
    importedAt: 0,
    modifiedAt: MODIFIED_AT,
    ...overrides,
  },
});

/**
 * Builds the drawn workout of a template with the drawn GKS branch 523,
 * saved at the given last change of the custom workout.
 *
 * generateDrawnWorkoutOf523(template, MODIFIED_AT)
 * → { templateModifiedAt: MODIFIED_AT, workout: { ...template, blocks: [{ kind: "branches", skill: "GKS", branches: ["523"], ... }] } }
 */
const generateDrawnWorkoutOf523 = (
  template: Template,
  templateModifiedAt: string,
) => ({
  templateModifiedAt,
  workout: {
    ...template,
    blocks: [
      generateBranchesBlock("GKS", ["523"], {
        pickedFrom: { picks: [{ tags: [], count: 1 }] },
      }),
    ],
  },
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
      templateModifiedAt: MODIFIED_AT,
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
    const drawnWorkout = generateDrawnWorkoutOf523(template, MODIFIED_AT);
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

  it("replays the drawn workout of a team training whose last change is unchanged", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const drawnWorkout = generateDrawnWorkoutOf523(template, MODIFIED_AT);
    const saveDrawnWorkout = jest.fn();
    mockSelectWorkout.mockReturnValue(generateSelection(template));

    generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template, {
          teamId: "team-1",
          importedAt: 5000,
        }),
        drawnWorkouts: { "custom-a": { STUDIO: drawnWorkout } },
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

  it("draws fresh and saves the new draw of a team training whose last change moved", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const saveDrawnWorkout = jest.fn();
    mockSelectWorkout.mockReturnValue(generateSelection(template));
    mockGenerateSetList.mockReturnValue(generateSetListResult(template, "510"));

    generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template, {
          teamId: "team-1",
          modifiedAt: "2026-11-02T09:30:00.654321+00:00",
        }),
        drawnWorkouts: {
          "custom-a": {
            STUDIO: generateDrawnWorkoutOf523(template, MODIFIED_AT),
          },
        },
        drawnWorkoutsHydrated: true,
        saveDrawnWorkout,
      },
      () => Math.random(),
      generateRequest(),
    );

    expect(mockGenerateSetList.mock.calls[0][0].workout).toBe(template);
    expect(saveDrawnWorkout).toHaveBeenCalledWith(
      "custom-a",
      "STUDIO",
      expect.objectContaining({
        templateModifiedAt: "2026-11-02T09:30:00.654321+00:00",
      }),
    );
  });

  it("replays the draw of an entry without a last change while its import time is unchanged", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const drawnWorkout = generateDrawnWorkoutOf523(
      template,
      "1970-01-01T00:00:01.000Z",
    );
    const saveDrawnWorkout = jest.fn();
    mockSelectWorkout.mockReturnValue(generateSelection(template));

    generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template, {
          importedAt: 1000,
          modifiedAt: undefined,
        }),
        drawnWorkouts: { "custom-a": { STUDIO: drawnWorkout } },
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

  it("draws fresh for an entry without a last change after a sync or import moved its import time", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const saveDrawnWorkout = jest.fn();
    mockSelectWorkout.mockReturnValue(generateSelection(template));
    mockGenerateSetList.mockReturnValue(generateSetListResult(template, "510"));

    generateTrainingSetList(
      {
        workoutsById: generateWorkoutsById(template, {
          importedAt: 2000,
          modifiedAt: undefined,
        }),
        drawnWorkouts: {
          "custom-a": {
            STUDIO: generateDrawnWorkoutOf523(
              template,
              "1970-01-01T00:00:01.000Z",
            ),
          },
        },
        drawnWorkoutsHydrated: true,
        saveDrawnWorkout,
      },
      () => Math.random(),
      generateRequest(),
    );

    expect(mockGenerateSetList.mock.calls[0][0].workout).toBe(template);
    expect(saveDrawnWorkout).toHaveBeenCalledWith(
      "custom-a",
      "STUDIO",
      expect.objectContaining({
        templateModifiedAt: "1970-01-01T00:00:02.000Z",
      }),
    );
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
