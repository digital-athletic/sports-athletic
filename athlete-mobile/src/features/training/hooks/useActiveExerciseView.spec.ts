import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE as BASELINE,
  createExercise,
  createExerciseData,
} from "@/features/training/utils/testFixtures";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { act, renderHook } from "@testing-library/react-native";
import { useActiveExerciseView } from "./useActiveExerciseView";

import { getExerciseById } from "@/data/exerciseRegistry";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";

jest.mock("@/data/exerciseRegistry", () => ({
  getExerciseById: jest.fn(),
}));

let mockLanguage = "en";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: mockLanguage },
  }),
}));

const mockGetExerciseById = getExerciseById as jest.Mock;

const exerciseDataById: Record<string, ExerciseType> = {
  "1": createExerciseData({
    id: "1",
    name: "Squat",
    displayName: "Squats",
    video: "squat.mp4",
  }),
  "2": createExerciseData({
    id: "2",
    name: "Lunge",
    displayName: "Lunges",
    video: "lunge.mp4",
  }),
};

describe("useActiveExerciseView: derived flags", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    mockGetExerciseById.mockImplementation(
      (id: string) => exerciseDataById[id],
    );
  });

  afterEach(() => {
    mockGetExerciseById.mockReset();
  });

  it("derives isPauseExercise true for the pause exercise id", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: PAUSE_EXERCISE_ID })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isPauseExercise).toBe(true);
  });

  it("derives isPauseExercise false for a non pause exercise id", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1" })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isPauseExercise).toBe(false);
  });

  it("derives isNextExercisePause true when the next exercise is a pause", async () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1" }),
        createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
      ],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isNextExercisePause).toBe(true);
  });

  it("derives isNextExercisePause false when there is no next exercise", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1" })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isNextExercisePause).toBe(false);
    expect(result.current.hasNextExercise).toBe(false);
  });

  it("derives the next pause past an already completed entry, not the literal next slot", async () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1" }),
        createExercise({ exerciseId: "2", completed: true }),
        createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
        createExercise({ exerciseId: "3" }),
      ],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.nextExercise?.exerciseId).toBe(PAUSE_EXERCISE_ID);
    expect(result.current.flags.isNextExercisePause).toBe(true);
  });

  it("derives isCardioExercise true when the skill includes CARDIO", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "CARDIO_1" })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isCardioExercise).toBe(true);
  });

  it("derives isCardioExercise false for a non cardio skill", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "SWR1" })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isCardioExercise).toBe(false);
  });

  it("derives isEnduranceExercise true for CARDIO_4", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "CARDIO_4" })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());
    expect(result.current.flags.isEnduranceExercise).toBe(true);
  });

  it("derives isEnduranceExercise true for CARDIO_5", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "CARDIO_5" })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());
    expect(result.current.flags.isEnduranceExercise).toBe(true);
  });

  it("derives isEnduranceExercise false for other cardio skills", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "CARDIO_1" })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isEnduranceExercise).toBe(false);
  });

  it("derives isTestExercise true when repetition is -1", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", repetition: -1 })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isTestExercise).toBe(true);
  });

  it("derives isLastInSet true when set bounds are equal", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", set: [3, 3] })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isLastInSet).toBe(true);
  });

  it("derives isLastInSet false when set bounds differ", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", set: [1, 3] })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isLastInSet).toBe(false);
  });

  it("derives isFeedbackSkill true for a feedback eligible skill on a PLAN training", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "SWR1" })],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isFeedbackSkill).toBe(true);
  });

  it("derives isFeedbackSkill false for a non increase skill on a PLAN training", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "WU" })],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isFeedbackSkill).toBe(false);
  });
});

describe("useActiveExerciseView: name and video selection", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    mockGetExerciseById.mockImplementation(
      (id: string) => exerciseDataById[id],
    );
  });

  afterEach(() => {
    mockGetExerciseById.mockReset();
  });

  it("selects the current exercise data when not a pause exercise", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1" })],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.name).toBe("Squats");
    expect(result.current.video).toBe("squat.mp4");
  });

  it("selects the next exercise data when the current exercise is a pause", async () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
        createExercise({ exerciseId: "2" }),
      ],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.name).toBe("Lunges");
    expect(result.current.video).toBe("lunge.mp4");
  });
});

describe("useActiveExerciseView: header title", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    mockLanguage = "en";
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
  });

  afterEach(() => {
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
  });

  it("shows the custom name of an imported training", async () => {
    const { id } = useCustomWorkoutsStore.getState().saveCustomWorkout(
      {
        aiwl: 1,
        id: "MY_CORE",
        name: { en: "My core", de: "Mein Rumpf" },
        blocks: [
          { kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] },
        ],
      },
      null,
    );
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: id },
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("My core");
  });

  it("shows the German custom name of an imported training in German", async () => {
    mockLanguage = "de";
    const { id } = useCustomWorkoutsStore.getState().saveCustomWorkout(
      {
        aiwl: 1,
        id: "MY_CORE",
        name: { en: "My core", de: "Mein Rumpf" },
        blocks: [
          { kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] },
        ],
      },
      null,
    );
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: id },
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("Mein Rumpf");
  });

  it("shows the custom name once the imported training arrives after the first render", async () => {
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "custom-late" },
    });
    const { result } = await renderHook(() => useActiveExerciseView());

    await act(() => {
      useCustomWorkoutsStore.setState({
        workoutsById: {
          "custom-late": {
            id: "custom-late",
            teamId: null,
            importedAt: 1,
            template: {
              aiwl: 1,
              id: "MY_CORE",
              name: { en: "My core" },
              blocks: [
                {
                  kind: "picks",
                  skill: "GKS",
                  picks: [{ tags: [], count: 2 }],
                },
              ],
            },
          },
        },
      });
    });

    expect(result.current.headerTitle).toBe("My core");
  });

  it("falls back to the plan title when there is no active training", async () => {
    useTrainingStore.setState({ activeTraining: null });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("training.active.title.plan");
  });

  it("shows the strength test title for a TEST_WORKOUT", async () => {
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "TEST_WORKOUT" },
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe(
      "training.active.title.strengthTest",
    );
  });

  it("shows the template title of a short workout", async () => {
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "PREVSHOULDER" },
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("Shoulder prevention");
  });

  it("shows the template title in the app language", async () => {
    mockLanguage = "de";
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "STABILITY" },
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("Stabilität");
  });

  it("falls back to the plan title for a type without a template", async () => {
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "HBCARDIO" },
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("training.active.title.plan");
  });
});

describe("useActiveExerciseView: derived active exercise index", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    mockGetExerciseById.mockImplementation(
      (id: string) => exerciseDataById[id],
    );
  });

  afterEach(() => {
    mockGetExerciseById.mockReset();
  });

  it("falls back to the last exercise when every entry is completed", async () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", completed: true }),
        createExercise({ exerciseId: "2", completed: true }),
      ],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.safeExerciseIndex).toBe(1);
    expect(result.current.exerciseId).toBe("2");
  });

  it("derives the first entry without the completed mark", async () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", completed: true }),
        createExercise({ exerciseId: "2" }),
      ],
    });

    const { result } = await renderHook(() => useActiveExerciseView());

    expect(result.current.safeExerciseIndex).toBe(1);
    expect(result.current.exerciseId).toBe("2");
  });
});
