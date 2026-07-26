import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE as BASELINE,
  createExercise,
  createExerciseData,
} from "@/features/training/utils/testFixtures";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { renderHook } from "@testing-library/react-native";
import { useActiveExerciseView } from "./useActiveExerciseView";

import { getExerciseById } from "@/data/exerciseRegistry";

jest.mock("@/data/exerciseRegistry", () => ({
  getExerciseById: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      if (key === "training.skill.SWR1") {
        return "Muscle development";
      }
      if (options?.defaultValue !== undefined) {
        return options.defaultValue;
      }
      return key;
    },
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

  it("derives isPauseExercise true for the pause exercise id", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: PAUSE_EXERCISE_ID })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isPauseExercise).toBe(true);
  });

  it("derives isPauseExercise false for a non pause exercise id", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1" })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isPauseExercise).toBe(false);
  });

  it("derives isNextExercisePause true when the next exercise is a pause", () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1" }),
        createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
      ],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isNextExercisePause).toBe(true);
  });

  it("derives isNextExercisePause false when there is no next exercise", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1" })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isNextExercisePause).toBe(false);
    expect(result.current.hasNextExercise).toBe(false);
  });

  it("derives isCardioExercise true when the skill includes CARDIO", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "CARDIO_1" })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isCardioExercise).toBe(true);
  });

  it("derives isCardioExercise false for a non cardio skill", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "SWR1" })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isCardioExercise).toBe(false);
  });

  it("derives isEnduranceExercise true for CARDIO_4", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "CARDIO_4" })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());
    expect(result.current.flags.isEnduranceExercise).toBe(true);
  });

  it("derives isEnduranceExercise true for CARDIO_5", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "CARDIO_5" })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());
    expect(result.current.flags.isEnduranceExercise).toBe(true);
  });

  it("derives isEnduranceExercise false for other cardio skills", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "CARDIO_1" })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isEnduranceExercise).toBe(false);
  });

  it("derives isTestExercise true when repetition is -1", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", repetition: -1 })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isTestExercise).toBe(true);
  });

  it("derives isLastInSet true when set bounds are equal", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", set: [3, 3] })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isLastInSet).toBe(true);
  });

  it("derives isLastInSet false when set bounds differ", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", set: [1, 3] })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isLastInSet).toBe(false);
  });

  it("derives isFeedbackSkill true for a feedback eligible skill on a PLAN training", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "SWR1" })],
      activeExerciseIndex: 0,
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.flags.isFeedbackSkill).toBe(true);
  });

  it("derives isFeedbackSkill false for a non increase skill on a PLAN training", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "WU" })],
      activeExerciseIndex: 0,
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    const { result } = renderHook(() => useActiveExerciseView());

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

  it("selects the current exercise data when not a pause exercise", () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1" })],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.name).toBe("Squats");
    expect(result.current.video).toBe("squat.mp4");
  });

  it("selects the next exercise data when the current exercise is a pause", () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
        createExercise({ exerciseId: "2" }),
      ],
      activeExerciseIndex: 0,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.name).toBe("Lunges");
    expect(result.current.video).toBe("lunge.mp4");
  });
});

describe("useActiveExerciseView: header title", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
  });

  it("falls back to the plan title when there is no active training", () => {
    useTrainingStore.setState({ activeTraining: null });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("training.active.title.plan");
  });

  it("shows the strength test title for a TEST_WORKOUT", () => {
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "TEST_WORKOUT" },
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe(
      "training.active.title.strengthTest",
    );
  });

  it("shows the translated skill title when a translation exists", () => {
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "SWR1" },
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("Muscle development");
  });

  it("falls back to the focus title for a non prevention skill without a translation", () => {
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "HBCARDIO" },
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("training.active.title.focus");
  });

  it("falls back to the prevention title for a prevention skill without a translation", () => {
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "PREVSHOULDER" },
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.headerTitle).toBe("training.active.title.prevention");
  });
});

describe("useActiveExerciseView: safe exercise index clamping", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    mockGetExerciseById.mockImplementation(
      (id: string) => exerciseDataById[id],
    );
  });

  afterEach(() => {
    mockGetExerciseById.mockReset();
  });

  it("clamps the active index to the last exercise when it exceeds the list length", () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1" }),
        createExercise({ exerciseId: "2" }),
      ],
      activeExerciseIndex: 5,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.safeExerciseIndex).toBe(1);
    expect(result.current.exerciseId).toBe("2");
  });

  it("uses the persisted index when it is within bounds", () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1" }),
        createExercise({ exerciseId: "2" }),
      ],
      activeExerciseIndex: 1,
    });

    const { result } = renderHook(() => useActiveExerciseView());

    expect(result.current.safeExerciseIndex).toBe(1);
    expect(result.current.exerciseId).toBe("2");
  });
});
