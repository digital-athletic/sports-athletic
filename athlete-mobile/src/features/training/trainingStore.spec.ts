import { act, renderHook } from "@testing-library/react-native";
import { ActiveTrainingType } from "./models/ActiveTraining";
import { DEFAULT_MAX_VALUES } from "./models/MaxValues";
import { UserExerciseDataType } from "./models/UserExerciseData";
import { UserProgressType } from "./models/UserProgress";
import { migrateTrainingStore, useTrainingStore } from "./trainingStore";

describe("useTrainingStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useTrainingStore.setState({
      selection: null,
      exerciseList: null,
      progressBefore: null,
      equipment: [],
      time: {
        start: undefined,
        end: undefined,
        pause: 0,
        skill: {
          PREVENTION: 0,
          MOBILITY: 0,
          SWR: 0,
          WARMUP: 0,
          STABILITY: 0,
          CARDIO: 0,
        },
      },
      activeTraining: null,
      tempMaxValues: null,
      trainingViewMode: null,
    });
  });

  const mockExercises: UserExerciseDataType[] = [
    {
      skill: "SWR1",
      exerciseId: "10",
      feedback: { difficulty: null },
      skipped: false,
    },
    {
      skill: "CARDIO_1",
      exerciseId: "20",
      feedback: { difficulty: null },
      skipped: false,
    },
    {
      skill: "WU",
      exerciseId: "30",
      feedback: { difficulty: null },
      skipped: false,
    },
  ];

  const makeProgress = (level: number, xp: number = 0): UserProgressType => ({
    xp,
    level,
    rank: "RANK",
    totals: {
      weightMoved: 0,
      timeTrained: 0,
      timeActive: 0,
      timeInactive: 0,
      timeStretched: 0,
      timeMobilised: 0,
      jumpsDone: 0,
      stepsDone: 0,
      exercisesSkipped: 0,
    },
    qualities: {},
    exercises: {},
  });

  // ============================================================================
  // Selection Management Tests
  // ============================================================================

  describe("setTrainingSelection", () => {
    it("should set training selection to PLAN", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingSelection("PLAN");
      });

      expect(result.current.selection).toBe("PLAN");
    });

    it("should set training selection to PREV", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingSelection("PREV");
      });

      expect(result.current.selection).toBe("PREV");
    });

    it("should set training selection to QUICK", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingSelection("QUICK");
      });

      expect(result.current.selection).toBe("QUICK");
    });

    it("should set selection to null", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingSelection("PLAN");
        result.current.setTrainingSelection(null);
      });

      expect(result.current.selection).toBeNull();
    });

    it("should update selection multiple times", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingSelection("PLAN");
      });
      expect(result.current.selection).toBe("PLAN");

      await act(() => {
        result.current.setTrainingSelection("PREV");
      });
      expect(result.current.selection).toBe("PREV");

      await act(() => {
        result.current.setTrainingSelection("QUICK");
      });
      expect(result.current.selection).toBe("QUICK");
    });
  });

  // ============================================================================
  // Exercise List Management Tests
  // ============================================================================

  describe("setExerciseList", () => {
    it("should set exercise list", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseList(mockExercises);
      });

      expect(result.current.exerciseList).toEqual(mockExercises);
      // mockExercises contains 3 items; expect full length
      expect(result.current.exerciseList?.length).toBe(3);
    });

    it("should set exercise list to null", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const mockExercises: UserExerciseDataType[] = [
        {
          skill: "SWR1",
          exerciseId: "10",
          feedback: { difficulty: null },
          skipped: false,
        },
      ];

      await act(() => {
        result.current.setExerciseList(mockExercises);
        result.current.setExerciseList(null);
      });

      expect(result.current.exerciseList).toBeNull();
    });

    it("should handle empty exercise list", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseList([]);
      });

      expect(result.current.exerciseList).toEqual([]);
      expect(result.current.exerciseList?.length).toBe(0);
    });

    it("should replace exercise list entirely", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const [first, second] = mockExercises;

      await act(() => {
        result.current.setExerciseList([first]);
      });
      expect(result.current.exerciseList).toEqual([first]);

      await act(() => {
        result.current.setExerciseList([second]);
      });
      expect(result.current.exerciseList).toEqual([second]);
      expect(result.current.exerciseList?.length).toBe(1);
    });
  });

  // ============================================================================
  // Exercise Feedback Tests
  // ============================================================================

  describe("setExerciseFeedback", () => {
    beforeEach(() => {
      useTrainingStore.setState({ exerciseList: mockExercises });
    });

    it("should set exercise feedback to SUCCEEDED", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseFeedback("10", "SUCCEEDED");
      });

      expect(result.current.exerciseList?.[0]?.feedback?.difficulty).toBe(
        "SUCCEEDED",
      );
    });

    it("should set exercise feedback to TOO_EASY", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseFeedback("20", "TOO_EASY");
      });

      expect(result.current.exerciseList?.[1]?.feedback?.difficulty).toBe(
        "TOO_EASY",
      );
    });

    it("should set exercise feedback to TOO_HARD", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseFeedback("30", "TOO_HARD");
      });

      expect(result.current.exerciseList?.[2]?.feedback?.difficulty).toBe(
        "TOO_HARD",
      );
    });

    it("should update feedback without affecting other exercises", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseFeedback("10", "SUCCEEDED");
        result.current.setExerciseFeedback("30", "TOO_EASY");
      });

      expect(result.current.exerciseList?.[0]?.feedback?.difficulty).toBe(
        "SUCCEEDED",
      );
      expect(result.current.exerciseList?.[1]?.feedback?.difficulty).toBeNull();
      expect(result.current.exerciseList?.[2]?.feedback?.difficulty).toBe(
        "TOO_EASY",
      );
    });

    it("should overwrite previous feedback", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseFeedback("10", "SUCCEEDED");
      });
      expect(result.current.exerciseList?.[0]?.feedback?.difficulty).toBe(
        "SUCCEEDED",
      );

      await act(() => {
        result.current.setExerciseFeedback("10", "TOO_HARD");
      });
      expect(result.current.exerciseList?.[0]?.feedback?.difficulty).toBe(
        "TOO_HARD",
      );
    });

    it("should handle feedback on null exercise list gracefully", async () => {
      useTrainingStore.setState({ exerciseList: null });
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseFeedback("10", "SUCCEEDED");
      });

      expect(result.current.exerciseList).toBeNull();
    });
  });

  // ============================================================================
  // Exercise Skipped Tests
  // ============================================================================

  describe("setExerciseSkipped", () => {
    beforeEach(() => {
      useTrainingStore.setState({ exerciseList: mockExercises });
    });

    it("should mark exercise as skipped", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseSkipped("10");
      });

      expect(result.current.exerciseList?.[0].skipped).toBe(true);
    });

    it("should mark specific exercise as skipped without affecting others", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseSkipped("20");
      });

      expect(result.current.exerciseList?.[0].skipped).toBe(false);
      expect(result.current.exerciseList?.[1].skipped).toBe(true);
      expect(result.current.exerciseList?.[2].skipped).toBe(false);
    });

    it("should mark multiple exercises as skipped", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseSkipped("10");
        result.current.setExerciseSkipped("30");
      });

      expect(result.current.exerciseList?.[0].skipped).toBe(true);
      expect(result.current.exerciseList?.[1].skipped).toBe(false);
      expect(result.current.exerciseList?.[2].skipped).toBe(true);
    });

    it("should handle skipped on null exercise list gracefully", async () => {
      useTrainingStore.setState({ exerciseList: null });
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseSkipped("10");
      });

      expect(result.current.exerciseList).toBeNull();
    });
  });

  // ============================================================================
  // Progress Before Tests
  // ============================================================================

  describe("setProgressBefore", () => {
    it("should set progress before training", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const mockProgress = makeProgress(2, 1000);

      await act(() => {
        result.current.setProgressBefore(mockProgress);
      });

      expect(result.current.progressBefore).toEqual(mockProgress);
    });

    it("should set progress before to null", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const mockProgress = makeProgress(1);

      await act(() => {
        result.current.setProgressBefore(mockProgress);
        result.current.setProgressBefore(null);
      });

      expect(result.current.progressBefore).toBeNull();
    });

    it("should update progress before multiple times", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const firstProgress = makeProgress(1);
      const secondProgress = makeProgress(2);

      await act(() => {
        result.current.setProgressBefore(firstProgress);
      });
      expect(result.current.progressBefore).toEqual(firstProgress);

      await act(() => {
        result.current.setProgressBefore(secondProgress);
      });
      expect(result.current.progressBefore).toEqual(secondProgress);
    });
  });

  // ============================================================================
  // Equipment Tests
  // ============================================================================

  describe("setEquipment", () => {
    it("should set equipment array", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const equipment = ["dumbbells", "barbell", "kettlebell"];

      await act(() => {
        result.current.setEquipment(equipment);
      });

      expect(result.current.equipment).toEqual(equipment);
    });

    it("should set empty equipment array", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setEquipment([]);
      });

      expect(result.current.equipment).toEqual([]);
    });

    it("should replace equipment array entirely", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const firstEquipment = ["dumbbells"];
      const secondEquipment = ["barbell", "kettlebell"];

      await act(() => {
        result.current.setEquipment(firstEquipment);
      });
      expect(result.current.equipment).toEqual(firstEquipment);

      await act(() => {
        result.current.setEquipment(secondEquipment);
      });
      expect(result.current.equipment).toEqual(secondEquipment);
      expect(result.current.equipment.length).toBe(2);
    });

    it("should handle single equipment", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setEquipment(["mat"]);
      });

      expect(result.current.equipment).toEqual(["mat"]);
      expect(result.current.equipment.length).toBe(1);
    });
  });

  // ============================================================================
  // Active Training Tests
  // ============================================================================

  describe("setActiveTraining", () => {
    it("should set active training", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const mockActiveTraining: ActiveTrainingType = {
        id: "workout-1",
        type: "PLAN",
      };

      await act(() => {
        result.current.setActiveTraining(mockActiveTraining);
      });

      expect(result.current.activeTraining).toEqual(mockActiveTraining);
    });

    it("should set active training to null", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const mockActiveTraining: ActiveTrainingType = {
        id: "workout-1",
        type: "PLAN",
      };

      await act(() => {
        result.current.setActiveTraining(mockActiveTraining);
        result.current.setActiveTraining(null);
      });

      expect(result.current.activeTraining).toBeNull();
    });

    it("should update active training", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const firstTraining: ActiveTrainingType = {
        id: "workout-1",
        type: "PLAN",
      };
      const secondTraining: ActiveTrainingType = {
        id: "workout-2",
        type: "PREV",
      };

      await act(() => {
        result.current.setActiveTraining(firstTraining);
      });
      expect(result.current.activeTraining).toEqual(firstTraining);

      await act(() => {
        result.current.setActiveTraining(secondTraining);
      });
      expect(result.current.activeTraining).toEqual(secondTraining);
    });
  });

  // ============================================================================
  // Time Tracking Tests
  // ============================================================================

  describe("setTrainingStartTime", () => {
    it("should set training start time", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const startTime = 1234567890;

      await act(() => {
        result.current.setTrainingStartTime(startTime);
      });

      expect(result.current.time.start).toBe(startTime);
    });

    it("should set start time to current timestamp", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const now = Date.now();

      await act(() => {
        result.current.setTrainingStartTime(now);
      });

      expect(result.current.time.start).toBe(now);
    });

    it("should update start time", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const firstTime = 1000;
      const secondTime = 2000;

      await act(() => {
        result.current.setTrainingStartTime(firstTime);
      });
      expect(result.current.time.start).toBe(firstTime);

      await act(() => {
        result.current.setTrainingStartTime(secondTime);
      });
      expect(result.current.time.start).toBe(secondTime);
    });

    it("should not affect other time properties", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const startTime = 1000;

      await act(() => {
        result.current.setTrainingStartTime(startTime);
      });

      expect(result.current.time.start).toBe(startTime);
      expect(result.current.time.end).toBeUndefined();
      expect(result.current.time.pause).toBe(0);
    });
  });

  describe("setTrainingEndTime", () => {
    it("should set training end time", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const endTime = 1234567900;

      await act(() => {
        result.current.setTrainingEndTime(endTime);
      });

      expect(result.current.time.end).toBe(endTime);
    });

    it("should set end time after start time", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const startTime = 1000;
      const endTime = 5000;

      await act(() => {
        result.current.setTrainingStartTime(startTime);
        result.current.setTrainingEndTime(endTime);
      });

      expect(result.current.time.start).toBe(startTime);
      expect(result.current.time.end).toBe(endTime);
    });

    it("should update end time", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingEndTime(2000);
      });
      expect(result.current.time.end).toBe(2000);

      await act(() => {
        result.current.setTrainingEndTime(3000);
      });
      expect(result.current.time.end).toBe(3000);
    });
  });

  describe("addPauseTime", () => {
    it("should add pause time to accumulator", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addPauseTime(5000);
      });

      expect(result.current.time.pause).toBe(5000);
    });

    it("should accumulate pause time across multiple calls", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addPauseTime(5000);
      });
      expect(result.current.time.pause).toBe(5000);

      await act(() => {
        result.current.addPauseTime(3000);
      });
      expect(result.current.time.pause).toBe(8000);

      await act(() => {
        result.current.addPauseTime(2000);
      });
      expect(result.current.time.pause).toBe(10000);
    });

    it("should handle zero pause time", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addPauseTime(0);
      });

      expect(result.current.time.pause).toBe(0);
    });

    it("should not affect other time properties", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingStartTime(1000);
        result.current.addPauseTime(5000);
      });

      expect(result.current.time.start).toBe(1000);
      expect(result.current.time.pause).toBe(5000);
      expect(result.current.time.skill.SWR).toBe(0);
    });
  });

  describe("addSkillTime", () => {
    it("should add time to PREVENTION skill", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("PREVENTION", 10000);
      });

      expect(result.current.time.skill.PREVENTION).toBe(10000);
    });

    it("should add time to MOBILITY skill", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("MOBILITY", 15000);
      });

      expect(result.current.time.skill.MOBILITY).toBe(15000);
    });

    it("should add time to SWR skill", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("SWR", 30000);
      });

      expect(result.current.time.skill.SWR).toBe(30000);
    });

    it("should add time to WARMUP skill", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("WARMUP", 5000);
      });

      expect(result.current.time.skill.WARMUP).toBe(5000);
    });

    it("should add time to STABILITY skill", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("STABILITY", 20000);
      });

      expect(result.current.time.skill.STABILITY).toBe(20000);
    });

    it("should add time to CARDIO skill", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("CARDIO", 25000);
      });

      expect(result.current.time.skill.CARDIO).toBe(25000);
    });

    it("should accumulate skill time across multiple calls", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("SWR", 10000);
      });
      expect(result.current.time.skill.SWR).toBe(10000);

      await act(() => {
        result.current.addSkillTime("SWR", 5000);
      });
      expect(result.current.time.skill.SWR).toBe(15000);

      await act(() => {
        result.current.addSkillTime("SWR", 8000);
      });
      expect(result.current.time.skill.SWR).toBe(23000);
    });

    it("should track multiple skills independently", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("SWR", 10000);
        result.current.addSkillTime("WARMUP", 5000);
        result.current.addSkillTime("CARDIO", 15000);
      });

      expect(result.current.time.skill.SWR).toBe(10000);
      expect(result.current.time.skill.WARMUP).toBe(5000);
      expect(result.current.time.skill.CARDIO).toBe(15000);
      expect(result.current.time.skill.PREVENTION).toBe(0);
      expect(result.current.time.skill.MOBILITY).toBe(0);
      expect(result.current.time.skill.STABILITY).toBe(0);
    });

    it("should handle zero skill time", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("SWR", 0);
      });

      expect(result.current.time.skill.SWR).toBe(0);
    });
  });

  // ============================================================================
  // Reset Tests
  // ============================================================================

  describe("clearTraining", () => {
    it("should reset all training state to defaults", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      // Setup state
      await act(() => {
        result.current.setTrainingSelection("PLAN");
        result.current.setExerciseList([
          {
            exerciseId: "10",
            skill: "SWR1",
            feedback: { difficulty: null },
            skipped: false,
          },
        ]);
        result.current.setProgressBefore(makeProgress(2));
        result.current.setEquipment(["dumbbells"]);
        result.current.setTrainingStartTime(1000);
        result.current.setTrainingEndTime(5000);
        result.current.addPauseTime(1000);
        result.current.addSkillTime("SWR", 30000);
      });

      // Verify state is set
      expect(result.current.selection).toBe("PLAN");
      expect(result.current.exerciseList).not.toBeNull();
      expect(result.current.progressBefore).not.toBeNull();
      expect(result.current.equipment).not.toEqual([]);
      expect(result.current.time.start).toBe(1000);
      expect(result.current.time.end).toBe(5000);
      expect(result.current.time.pause).toBe(1000);
      expect(result.current.time.skill.SWR).toBe(30000);

      // Reset
      await act(() => {
        result.current.clearTraining();
      });

      // Verify reset
      expect(result.current.selection).toBe("PLAN"); // Selection not reset
      expect(result.current.exerciseList).toBeNull();
      expect(result.current.progressBefore).toBeNull();
      expect(result.current.equipment).toEqual([]);
      expect(result.current.time.start).toBeUndefined();
      expect(result.current.time.end).toBeUndefined();
      expect(result.current.time.pause).toBe(0);
      expect(result.current.time.skill.SWR).toBe(0);
      expect(result.current.activeTraining).toBeNull();
    });

    it("should preserve selection after reset", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingSelection("QUICK");
        result.current.setTrainingStartTime(1000);
        result.current.clearTraining();
      });

      expect(result.current.selection).toBe("QUICK");
      expect(result.current.time.start).toBeUndefined();
    });

    it("should reset all skill times to zero", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.addSkillTime("PREVENTION", 5000);
        result.current.addSkillTime("MOBILITY", 10000);
        result.current.addSkillTime("SWR", 20000);
        result.current.addSkillTime("WARMUP", 3000);
        result.current.addSkillTime("STABILITY", 8000);
        result.current.addSkillTime("CARDIO", 15000);
      });

      // Verify all skills have time
      expect(result.current.time.skill.PREVENTION).toBe(5000);
      expect(result.current.time.skill.MOBILITY).toBe(10000);
      expect(result.current.time.skill.SWR).toBe(20000);
      expect(result.current.time.skill.WARMUP).toBe(3000);
      expect(result.current.time.skill.STABILITY).toBe(8000);
      expect(result.current.time.skill.CARDIO).toBe(15000);

      await act(() => {
        result.current.clearTraining();
      });

      // Verify all skills reset to zero
      expect(result.current.time.skill.PREVENTION).toBe(0);
      expect(result.current.time.skill.MOBILITY).toBe(0);
      expect(result.current.time.skill.SWR).toBe(0);
      expect(result.current.time.skill.WARMUP).toBe(0);
      expect(result.current.time.skill.STABILITY).toBe(0);
      expect(result.current.time.skill.CARDIO).toBe(0);
    });

    it("should reset exercise list and active training", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseList([
          {
            exerciseId: "10",
            skill: "SWR1",
            feedback: { difficulty: null },
            skipped: false,
          },
        ]);
        result.current.setActiveTraining({ id: "workout-test", type: "PLAN" });
      });

      expect(result.current.exerciseList).not.toBeNull();
      expect(result.current.activeTraining).not.toBeNull();

      await act(() => {
        result.current.clearTraining();
      });

      expect(result.current.exerciseList).toBeNull();
      expect(result.current.activeTraining).toBeNull();
    });

    it("should reset tempMaxValues", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTempMaxValues(DEFAULT_MAX_VALUES);
      });

      expect(result.current.tempMaxValues).toEqual(DEFAULT_MAX_VALUES);

      await act(() => {
        result.current.clearTraining();
      });

      expect(result.current.tempMaxValues).toBeNull();
    });

    it("should reset trainingViewMode", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingViewMode("LIST");
      });

      expect(result.current.trainingViewMode).toBe("LIST");

      await act(() => {
        result.current.clearTraining();
      });

      expect(result.current.trainingViewMode).toBeNull();
    });
  });

  // ============================================================================
  // Temp Max Values Tests
  // ============================================================================

  describe("useTrainingStore: setTempMaxValues", () => {
    it("should set a MaxValuesType value", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTempMaxValues(DEFAULT_MAX_VALUES);
      });

      expect(result.current.tempMaxValues).toEqual(DEFAULT_MAX_VALUES);
    });

    it("should set tempMaxValues back to null", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTempMaxValues(DEFAULT_MAX_VALUES);
      });
      expect(result.current.tempMaxValues).not.toBeNull();

      await act(() => {
        result.current.setTempMaxValues(null);
      });
      expect(result.current.tempMaxValues).toBeNull();
    });
  });

  // ============================================================================
  // Training View Mode Tests
  // ============================================================================

  describe("setTrainingViewMode", () => {
    it("should default to null", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      expect(result.current.trainingViewMode).toBeNull();
    });

    it("should set the mode to SEQUENTIAL", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingViewMode("SEQUENTIAL");
      });

      expect(result.current.trainingViewMode).toBe("SEQUENTIAL");
    });

    it("should set the mode to LIST", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingViewMode("LIST");
      });

      expect(result.current.trainingViewMode).toBe("LIST");
    });

    it("should reset the mode to null", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setTrainingViewMode("LIST");
        result.current.setTrainingViewMode(null);
      });

      expect(result.current.trainingViewMode).toBeNull();
    });
  });

  // ============================================================================
  // Exercise Completed Tests
  // ============================================================================

  describe("markExerciseCompleted", () => {
    beforeEach(() => {
      useTrainingStore.setState({ exerciseList: mockExercises });
    });

    it("should leave entries uncompleted by default", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      expect(result.current.exerciseList?.[0]?.completed).toBeUndefined();
    });

    it("should mark the exercise at the given index as completed", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.markExerciseCompleted(0);
      });

      expect(result.current.exerciseList?.[0]?.completed).toBe(true);
    });

    it("should mark multiple indices independently of call order", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.markExerciseCompleted(2);
        result.current.markExerciseCompleted(0);
      });

      expect(result.current.exerciseList?.[0]?.completed).toBe(true);
      expect(result.current.exerciseList?.[1]?.completed).toBeUndefined();
      expect(result.current.exerciseList?.[2]?.completed).toBe(true);
    });

    it("should be idempotent when marking the same index twice", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.markExerciseCompleted(1);
        result.current.markExerciseCompleted(1);
      });

      expect(result.current.exerciseList?.[1]?.completed).toBe(true);
    });

    it("should handle marking completed on a null exercise list gracefully", async () => {
      useTrainingStore.setState({ exerciseList: null });
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.markExerciseCompleted(0);
      });

      expect(result.current.exerciseList).toBeNull();
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("Integration scenarios", () => {
    it("should handle complete training session flow", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      // Start training session
      await act(() => {
        result.current.setTrainingSelection("PLAN");
        result.current.setTrainingStartTime(1000);
      });

      expect(result.current.selection).toBe("PLAN");
      expect(result.current.time.start).toBe(1000);

      // Add exercises
      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: "10",
          skill: "SWR1",
          feedback: { difficulty: null },
          skipped: false,
        },
        {
          exerciseId: "20",
          skill: "CARDIO_1",
          feedback: { difficulty: null },
          skipped: false,
        },
      ];

      await act(() => {
        result.current.setExerciseList(exercises);
      });

      expect(result.current.exerciseList?.length).toBe(2);

      // Track training activity
      await act(() => {
        result.current.addSkillTime("SWR", 30000);
        result.current.addPauseTime(2000);
        result.current.setExerciseFeedback("10", "SUCCEEDED");
      });

      expect(result.current.time.skill.SWR).toBe(30000);
      expect(result.current.time.pause).toBe(2000);
      expect(result.current.exerciseList?.[0]?.feedback?.difficulty).toBe(
        "SUCCEEDED",
      );

      // End training
      await act(() => {
        result.current.setTrainingEndTime(31000);
      });

      expect(result.current.time.end).toBe(31000);
    });

    it("should support multiple training sessions with reset", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      // First session
      await act(() => {
        result.current.setTrainingSelection("PLAN");
        result.current.setTrainingStartTime(1000);
        result.current.addSkillTime("SWR", 30000);
      });

      expect(result.current.selection).toBe("PLAN");
      expect(result.current.time.skill.SWR).toBe(30000);

      // Reset for next session
      await act(() => {
        result.current.clearTraining();
      });

      expect(result.current.time.start).toBeUndefined();
      expect(result.current.time.skill.SWR).toBe(0);

      // Second session
      await act(() => {
        result.current.setTrainingStartTime(2000);
        result.current.addSkillTime("CARDIO", 20000);
      });

      expect(result.current.time.start).toBe(2000);
      expect(result.current.time.skill.CARDIO).toBe(20000);
      expect(result.current.time.skill.SWR).toBe(0);
    });

    it("should accumulate data across different state updates", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      // Multiple state updates without reset
      await act(() => {
        result.current.setTrainingSelection("PREV");
        result.current.setEquipment(["dumbbells"]);
        result.current.addSkillTime("PREVENTION", 5000);
      });

      await act(() => {
        result.current.setEquipment(["dumbbells", "barbell"]);
        result.current.addSkillTime("PREVENTION", 3000);
      });

      await act(() => {
        result.current.setTrainingStartTime(1000);
        result.current.addSkillTime("PREVENTION", 2000);
      });

      expect(result.current.selection).toBe("PREV");
      expect(result.current.equipment).toEqual(["dumbbells", "barbell"]);
      expect(result.current.time.skill.PREVENTION).toBe(10000);
      expect(result.current.time.start).toBe(1000);
    });

    it("should maintain independent state for multiple hooks", async () => {
      const { result: hook1 } = await renderHook(() => useTrainingStore());
      const { result: hook2 } = await renderHook(() => useTrainingStore());

      // Both hooks share same store
      await act(() => {
        hook1.current.setTrainingSelection("PLAN");
      });

      expect(hook2.current.selection).toBe("PLAN");

      await act(() => {
        hook2.current.addSkillTime("SWR", 10000);
      });

      expect(hook1.current.time.skill.SWR).toBe(10000);
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================

  describe("Edge cases", () => {
    it("should handle very large time values", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const largeTime = Number.MAX_SAFE_INTEGER;

      await act(() => {
        result.current.setTrainingStartTime(largeTime);
      });

      expect(result.current.time.start).toBe(largeTime);
    });

    it("should handle rapid successive updates", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addSkillTime("SWR", 1000);
        }
      });

      expect(result.current.time.skill.SWR).toBe(100000);
    });

    it("should handle updating null exercise list without error", async () => {
      const { result } = await renderHook(() => useTrainingStore());

      await act(() => {
        result.current.setExerciseList(null);
        result.current.setExerciseFeedback("10", "SUCCEEDED");
        result.current.setExerciseSkipped("10");
      });

      expect(result.current.exerciseList).toBeNull();
    });

    it("should handle unknown exercise ids", async () => {
      const { result } = await renderHook(() => useTrainingStore());
      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: "10",
          skill: "SWR1",
          feedback: { difficulty: null },
          skipped: false,
        },
      ];

      await act(() => {
        result.current.setExerciseList(exercises);
        result.current.setExerciseFeedback("-1", "SUCCEEDED"); // Unknown exercise Id
      });

      expect(
        result.current.exerciseList?.[0]?.feedback?.difficulty ?? null,
      ).toBeNull();
    });
  });
});

describe("migrateTrainingStore: legacy version bridge", () => {
  const migratedFixture = {
    selection: "QUICK",
    exerciseList: [
      {
        skill: "SWR1",
        exerciseId: "10",
        feedback: { difficulty: null },
        skipped: false,
      },
      {
        skill: "SWR1",
        exerciseId: "20",
        feedback: { difficulty: null },
        skipped: false,
      },
    ],
    progressBefore: null,
    equipment: ["DUMBBELL"],
    time: {
      start: 1000,
      end: undefined,
      pause: 5,
      skill: {
        PREVENTION: 0,
        MOBILITY: 0,
        SWR: 0,
        WARMUP: 0,
        STABILITY: 0,
        CARDIO: 0,
      },
    },
    activeTraining: null,
    tempMaxValues: null,
  };

  const persistedAtVersionZero = { ...migratedFixture, activeExerciseIndex: 2 };

  it("preserves user data persisted at legacy version 0", () => {
    const result = migrateTrainingStore(persistedAtVersionZero, 0);

    expect(result).toEqual({ ...migratedFixture, trainingViewMode: null });
  });

  it("applies the v14 -> v16 migrations when persisted at v14", () => {
    const result = migrateTrainingStore(persistedAtVersionZero, 14);

    expect(result).toEqual({ ...migratedFixture, trainingViewMode: null });
  });

  it("folds completedExerciseIndices persisted at v15 into per-entry marks", () => {
    const persistedAtV15 = {
      ...persistedAtVersionZero,
      trainingViewMode: null,
      completedExerciseIndices: [1],
    };

    const result = migrateTrainingStore(persistedAtV15, 15);

    expect(result.exerciseList?.[0]?.completed).toBeUndefined();
    expect(result.exerciseList?.[1]?.completed).toBe(true);
    expect(result).not.toHaveProperty("completedExerciseIndices");
    expect(result).not.toHaveProperty("activeExerciseIndex");
  });

  it("returns state unchanged when already at the registered version", () => {
    const persistedAtCurrentVersion = {
      ...migratedFixture,
      trainingViewMode: null,
    };

    const result = migrateTrainingStore(persistedAtCurrentVersion, 16);

    expect(result).toEqual(persistedAtCurrentVersion);
  });

  it("resets to defaults for unknown ancient versions", () => {
    const result = migrateTrainingStore(persistedAtVersionZero, 5);

    expect(result.selection).toBeNull();
    expect(result.trainingViewMode).toBeNull();
    expect(result.tempMaxValues).toBeNull();
    expect(result.time.start).toBeUndefined();
  });

  it("resets to defaults for non integer versions", () => {
    const result = migrateTrainingStore(persistedAtVersionZero, Number.NaN);

    expect(result.selection).toBeNull();
    expect(result.trainingViewMode).toBeNull();
  });
});
