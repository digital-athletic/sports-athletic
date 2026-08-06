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
      activeExerciseIndex: 0,
      tempMaxValues: null,
      trainingViewMode: null,
      completedExerciseIndices: [],
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
    it("should set training selection to PLAN", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingSelection("PLAN");
      });

      expect(result.current.selection).toBe("PLAN");
    });

    it("should set training selection to PREV", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingSelection("PREV");
      });

      expect(result.current.selection).toBe("PREV");
    });

    it("should set training selection to QUICK", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingSelection("QUICK");
      });

      expect(result.current.selection).toBe("QUICK");
    });

    it("should set selection to null", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingSelection("PLAN");
        result.current.setTrainingSelection(null);
      });

      expect(result.current.selection).toBeNull();
    });

    it("should update selection multiple times", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingSelection("PLAN");
      });
      expect(result.current.selection).toBe("PLAN");

      act(() => {
        result.current.setTrainingSelection("PREV");
      });
      expect(result.current.selection).toBe("PREV");

      act(() => {
        result.current.setTrainingSelection("QUICK");
      });
      expect(result.current.selection).toBe("QUICK");
    });
  });

  // ============================================================================
  // Exercise List Management Tests
  // ============================================================================

  describe("setExerciseList", () => {
    it("should set exercise list", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseList(mockExercises);
      });

      expect(result.current.exerciseList).toEqual(mockExercises);
      // mockExercises contains 3 items; expect full length
      expect(result.current.exerciseList?.length).toBe(3);
    });

    it("should set exercise list to null", () => {
      const { result } = renderHook(() => useTrainingStore());
      const mockExercises: UserExerciseDataType[] = [
        {
          skill: "SWR1",
          exerciseId: "10",
          feedback: { difficulty: null },
          skipped: false,
        },
      ];

      act(() => {
        result.current.setExerciseList(mockExercises);
        result.current.setExerciseList(null);
      });

      expect(result.current.exerciseList).toBeNull();
    });

    it("should handle empty exercise list", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseList([]);
      });

      expect(result.current.exerciseList).toEqual([]);
      expect(result.current.exerciseList?.length).toBe(0);
    });

    it("should replace exercise list entirely", () => {
      const { result } = renderHook(() => useTrainingStore());
      const [first, second] = mockExercises;

      act(() => {
        result.current.setExerciseList([first]);
      });
      expect(result.current.exerciseList).toEqual([first]);

      act(() => {
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

    it("should set exercise feedback to SUCCEEDED", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseFeedback("10", "SUCCEEDED");
      });

      expect(result.current.exerciseList?.[0]?.feedback?.difficulty).toBe(
        "SUCCEEDED",
      );
    });

    it("should set exercise feedback to TOO_EASY", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseFeedback("20", "TOO_EASY");
      });

      expect(result.current.exerciseList?.[1]?.feedback?.difficulty).toBe(
        "TOO_EASY",
      );
    });

    it("should set exercise feedback to TOO_HARD", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseFeedback("30", "TOO_HARD");
      });

      expect(result.current.exerciseList?.[2]?.feedback?.difficulty).toBe(
        "TOO_HARD",
      );
    });

    it("should update feedback without affecting other exercises", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
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

    it("should overwrite previous feedback", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseFeedback("10", "SUCCEEDED");
      });
      expect(result.current.exerciseList?.[0]?.feedback?.difficulty).toBe(
        "SUCCEEDED",
      );

      act(() => {
        result.current.setExerciseFeedback("10", "TOO_HARD");
      });
      expect(result.current.exerciseList?.[0]?.feedback?.difficulty).toBe(
        "TOO_HARD",
      );
    });

    it("should handle feedback on null exercise list gracefully", () => {
      useTrainingStore.setState({ exerciseList: null });
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
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

    it("should mark exercise as skipped", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseSkipped("10");
      });

      expect(result.current.exerciseList?.[0].skipped).toBe(true);
    });

    it("should mark specific exercise as skipped without affecting others", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseSkipped("20");
      });

      expect(result.current.exerciseList?.[0].skipped).toBe(false);
      expect(result.current.exerciseList?.[1].skipped).toBe(true);
      expect(result.current.exerciseList?.[2].skipped).toBe(false);
    });

    it("should mark multiple exercises as skipped", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseSkipped("10");
        result.current.setExerciseSkipped("30");
      });

      expect(result.current.exerciseList?.[0].skipped).toBe(true);
      expect(result.current.exerciseList?.[1].skipped).toBe(false);
      expect(result.current.exerciseList?.[2].skipped).toBe(true);
    });

    it("should handle skipped on null exercise list gracefully", () => {
      useTrainingStore.setState({ exerciseList: null });
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseSkipped("10");
      });

      expect(result.current.exerciseList).toBeNull();
    });
  });

  // ============================================================================
  // Progress Before Tests
  // ============================================================================

  describe("setProgressBefore", () => {
    it("should set progress before training", () => {
      const { result } = renderHook(() => useTrainingStore());
      const mockProgress = makeProgress(2, 1000);

      act(() => {
        result.current.setProgressBefore(mockProgress);
      });

      expect(result.current.progressBefore).toEqual(mockProgress);
    });

    it("should set progress before to null", () => {
      const { result } = renderHook(() => useTrainingStore());
      const mockProgress = makeProgress(1);

      act(() => {
        result.current.setProgressBefore(mockProgress);
        result.current.setProgressBefore(null);
      });

      expect(result.current.progressBefore).toBeNull();
    });

    it("should update progress before multiple times", () => {
      const { result } = renderHook(() => useTrainingStore());
      const firstProgress = makeProgress(1);
      const secondProgress = makeProgress(2);

      act(() => {
        result.current.setProgressBefore(firstProgress);
      });
      expect(result.current.progressBefore).toEqual(firstProgress);

      act(() => {
        result.current.setProgressBefore(secondProgress);
      });
      expect(result.current.progressBefore).toEqual(secondProgress);
    });
  });

  // ============================================================================
  // Equipment Tests
  // ============================================================================

  describe("setEquipment", () => {
    it("should set equipment array", () => {
      const { result } = renderHook(() => useTrainingStore());
      const equipment = ["dumbbells", "barbell", "kettlebell"];

      act(() => {
        result.current.setEquipment(equipment);
      });

      expect(result.current.equipment).toEqual(equipment);
    });

    it("should set empty equipment array", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setEquipment([]);
      });

      expect(result.current.equipment).toEqual([]);
    });

    it("should replace equipment array entirely", () => {
      const { result } = renderHook(() => useTrainingStore());
      const firstEquipment = ["dumbbells"];
      const secondEquipment = ["barbell", "kettlebell"];

      act(() => {
        result.current.setEquipment(firstEquipment);
      });
      expect(result.current.equipment).toEqual(firstEquipment);

      act(() => {
        result.current.setEquipment(secondEquipment);
      });
      expect(result.current.equipment).toEqual(secondEquipment);
      expect(result.current.equipment.length).toBe(2);
    });

    it("should handle single equipment", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
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
    it("should set active training", () => {
      const { result } = renderHook(() => useTrainingStore());
      const mockActiveTraining: ActiveTrainingType = {
        id: "workout-1",
        type: "PLAN",
      };

      act(() => {
        result.current.setActiveTraining(mockActiveTraining);
      });

      expect(result.current.activeTraining).toEqual(mockActiveTraining);
    });

    it("should set active training to null", () => {
      const { result } = renderHook(() => useTrainingStore());
      const mockActiveTraining: ActiveTrainingType = {
        id: "workout-1",
        type: "PLAN",
      };

      act(() => {
        result.current.setActiveTraining(mockActiveTraining);
        result.current.setActiveTraining(null);
      });

      expect(result.current.activeTraining).toBeNull();
    });

    it("should update active training", () => {
      const { result } = renderHook(() => useTrainingStore());
      const firstTraining: ActiveTrainingType = {
        id: "workout-1",
        type: "PLAN",
      };
      const secondTraining: ActiveTrainingType = {
        id: "workout-2",
        type: "PREV",
      };

      act(() => {
        result.current.setActiveTraining(firstTraining);
      });
      expect(result.current.activeTraining).toEqual(firstTraining);

      act(() => {
        result.current.setActiveTraining(secondTraining);
      });
      expect(result.current.activeTraining).toEqual(secondTraining);
    });
  });

  // ============================================================================
  // Time Tracking Tests
  // ============================================================================

  describe("setTrainingStartTime", () => {
    it("should set training start time", () => {
      const { result } = renderHook(() => useTrainingStore());
      const startTime = 1234567890;

      act(() => {
        result.current.setTrainingStartTime(startTime);
      });

      expect(result.current.time.start).toBe(startTime);
    });

    it("should set start time to current timestamp", () => {
      const { result } = renderHook(() => useTrainingStore());
      const now = Date.now();

      act(() => {
        result.current.setTrainingStartTime(now);
      });

      expect(result.current.time.start).toBe(now);
    });

    it("should update start time", () => {
      const { result } = renderHook(() => useTrainingStore());
      const firstTime = 1000;
      const secondTime = 2000;

      act(() => {
        result.current.setTrainingStartTime(firstTime);
      });
      expect(result.current.time.start).toBe(firstTime);

      act(() => {
        result.current.setTrainingStartTime(secondTime);
      });
      expect(result.current.time.start).toBe(secondTime);
    });

    it("should not affect other time properties", () => {
      const { result } = renderHook(() => useTrainingStore());
      const startTime = 1000;

      act(() => {
        result.current.setTrainingStartTime(startTime);
      });

      expect(result.current.time.start).toBe(startTime);
      expect(result.current.time.end).toBeUndefined();
      expect(result.current.time.pause).toBe(0);
    });
  });

  describe("setTrainingEndTime", () => {
    it("should set training end time", () => {
      const { result } = renderHook(() => useTrainingStore());
      const endTime = 1234567900;

      act(() => {
        result.current.setTrainingEndTime(endTime);
      });

      expect(result.current.time.end).toBe(endTime);
    });

    it("should set end time after start time", () => {
      const { result } = renderHook(() => useTrainingStore());
      const startTime = 1000;
      const endTime = 5000;

      act(() => {
        result.current.setTrainingStartTime(startTime);
        result.current.setTrainingEndTime(endTime);
      });

      expect(result.current.time.start).toBe(startTime);
      expect(result.current.time.end).toBe(endTime);
    });

    it("should update end time", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingEndTime(2000);
      });
      expect(result.current.time.end).toBe(2000);

      act(() => {
        result.current.setTrainingEndTime(3000);
      });
      expect(result.current.time.end).toBe(3000);
    });
  });

  describe("addPauseTime", () => {
    it("should add pause time to accumulator", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addPauseTime(5000);
      });

      expect(result.current.time.pause).toBe(5000);
    });

    it("should accumulate pause time across multiple calls", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addPauseTime(5000);
      });
      expect(result.current.time.pause).toBe(5000);

      act(() => {
        result.current.addPauseTime(3000);
      });
      expect(result.current.time.pause).toBe(8000);

      act(() => {
        result.current.addPauseTime(2000);
      });
      expect(result.current.time.pause).toBe(10000);
    });

    it("should handle zero pause time", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addPauseTime(0);
      });

      expect(result.current.time.pause).toBe(0);
    });

    it("should not affect other time properties", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingStartTime(1000);
        result.current.addPauseTime(5000);
      });

      expect(result.current.time.start).toBe(1000);
      expect(result.current.time.pause).toBe(5000);
      expect(result.current.time.skill.SWR).toBe(0);
    });
  });

  describe("addSkillTime", () => {
    it("should add time to PREVENTION skill", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addSkillTime("PREVENTION", 10000);
      });

      expect(result.current.time.skill.PREVENTION).toBe(10000);
    });

    it("should add time to MOBILITY skill", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addSkillTime("MOBILITY", 15000);
      });

      expect(result.current.time.skill.MOBILITY).toBe(15000);
    });

    it("should add time to SWR skill", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addSkillTime("SWR", 30000);
      });

      expect(result.current.time.skill.SWR).toBe(30000);
    });

    it("should add time to WARMUP skill", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addSkillTime("WARMUP", 5000);
      });

      expect(result.current.time.skill.WARMUP).toBe(5000);
    });

    it("should add time to STABILITY skill", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addSkillTime("STABILITY", 20000);
      });

      expect(result.current.time.skill.STABILITY).toBe(20000);
    });

    it("should add time to CARDIO skill", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addSkillTime("CARDIO", 25000);
      });

      expect(result.current.time.skill.CARDIO).toBe(25000);
    });

    it("should accumulate skill time across multiple calls", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addSkillTime("SWR", 10000);
      });
      expect(result.current.time.skill.SWR).toBe(10000);

      act(() => {
        result.current.addSkillTime("SWR", 5000);
      });
      expect(result.current.time.skill.SWR).toBe(15000);

      act(() => {
        result.current.addSkillTime("SWR", 8000);
      });
      expect(result.current.time.skill.SWR).toBe(23000);
    });

    it("should track multiple skills independently", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
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

    it("should handle zero skill time", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.addSkillTime("SWR", 0);
      });

      expect(result.current.time.skill.SWR).toBe(0);
    });
  });

  // ============================================================================
  // Reset Tests
  // ============================================================================

  describe("clearTraining", () => {
    it("should reset all training state to defaults", () => {
      const { result } = renderHook(() => useTrainingStore());

      // Setup state
      act(() => {
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
      act(() => {
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

    it("should preserve selection after reset", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingSelection("QUICK");
        result.current.setTrainingStartTime(1000);
        result.current.clearTraining();
      });

      expect(result.current.selection).toBe("QUICK");
      expect(result.current.time.start).toBeUndefined();
    });

    it("should reset all skill times to zero", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
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

      act(() => {
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

    it("should reset exercise list and active training", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
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

      act(() => {
        result.current.clearTraining();
      });

      expect(result.current.exerciseList).toBeNull();
      expect(result.current.activeTraining).toBeNull();
    });

    it("should reset activeExerciseIndex and tempMaxValues", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setActiveExerciseIndex(3);
        result.current.setTempMaxValues(DEFAULT_MAX_VALUES);
      });

      expect(result.current.activeExerciseIndex).toBe(3);
      expect(result.current.tempMaxValues).toEqual(DEFAULT_MAX_VALUES);

      act(() => {
        result.current.clearTraining();
      });

      expect(result.current.activeExerciseIndex).toBe(0);
      expect(result.current.tempMaxValues).toBeNull();
    });

    it("should reset trainingViewMode and completedExerciseIndices", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingViewMode("LIST");
        result.current.markExerciseCompleted(0);
      });

      expect(result.current.trainingViewMode).toBe("LIST");
      expect(result.current.completedExerciseIndices).toEqual([0]);

      act(() => {
        result.current.clearTraining();
      });

      expect(result.current.trainingViewMode).toBeNull();
      expect(result.current.completedExerciseIndices).toEqual([]);
    });
  });

  // ============================================================================
  // Active Exercise Index Tests
  // ============================================================================

  describe("useTrainingStore: setActiveExerciseIndex", () => {
    it("should default to 0", () => {
      const { result } = renderHook(() => useTrainingStore());

      expect(result.current.activeExerciseIndex).toBe(0);
    });

    it("should set the active exercise index", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setActiveExerciseIndex(2);
      });

      expect(result.current.activeExerciseIndex).toBe(2);
    });

    it("should update the active exercise index multiple times", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setActiveExerciseIndex(1);
      });
      expect(result.current.activeExerciseIndex).toBe(1);

      act(() => {
        result.current.setActiveExerciseIndex(4);
      });
      expect(result.current.activeExerciseIndex).toBe(4);

      act(() => {
        result.current.setActiveExerciseIndex(0);
      });
      expect(result.current.activeExerciseIndex).toBe(0);
    });
  });

  // ============================================================================
  // Temp Max Values Tests
  // ============================================================================

  describe("useTrainingStore: setTempMaxValues", () => {
    it("should set a MaxValuesType value", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTempMaxValues(DEFAULT_MAX_VALUES);
      });

      expect(result.current.tempMaxValues).toEqual(DEFAULT_MAX_VALUES);
    });

    it("should set tempMaxValues back to null", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTempMaxValues(DEFAULT_MAX_VALUES);
      });
      expect(result.current.tempMaxValues).not.toBeNull();

      act(() => {
        result.current.setTempMaxValues(null);
      });
      expect(result.current.tempMaxValues).toBeNull();
    });
  });

  // ============================================================================
  // Training View Mode Tests
  // ============================================================================

  describe("setTrainingViewMode", () => {
    it("should default to null", () => {
      const { result } = renderHook(() => useTrainingStore());

      expect(result.current.trainingViewMode).toBeNull();
    });

    it("should set the mode to SEQUENTIAL", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingViewMode("SEQUENTIAL");
      });

      expect(result.current.trainingViewMode).toBe("SEQUENTIAL");
    });

    it("should set the mode to LIST", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingViewMode("LIST");
      });

      expect(result.current.trainingViewMode).toBe("LIST");
    });

    it("should reset the mode to null", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setTrainingViewMode("LIST");
        result.current.setTrainingViewMode(null);
      });

      expect(result.current.trainingViewMode).toBeNull();
    });
  });

  // ============================================================================
  // Completed Exercise Indices Tests
  // ============================================================================

  describe("markExerciseCompleted", () => {
    it("should default to an empty array", () => {
      const { result } = renderHook(() => useTrainingStore());

      expect(result.current.completedExerciseIndices).toEqual([]);
    });

    it("should add an index", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.markExerciseCompleted(0);
      });

      expect(result.current.completedExerciseIndices).toEqual([0]);
    });

    it("should accumulate multiple indices in call order", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.markExerciseCompleted(2);
        result.current.markExerciseCompleted(0);
        result.current.markExerciseCompleted(1);
      });

      expect(result.current.completedExerciseIndices).toEqual([2, 0, 1]);
    });

    it("should not add the same index twice", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.markExerciseCompleted(1);
        result.current.markExerciseCompleted(1);
      });

      expect(result.current.completedExerciseIndices).toEqual([1]);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("Integration scenarios", () => {
    it("should handle complete training session flow", () => {
      const { result } = renderHook(() => useTrainingStore());

      // Start training session
      act(() => {
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

      act(() => {
        result.current.setExerciseList(exercises);
      });

      expect(result.current.exerciseList?.length).toBe(2);

      // Track training activity
      act(() => {
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
      act(() => {
        result.current.setTrainingEndTime(31000);
      });

      expect(result.current.time.end).toBe(31000);
    });

    it("should support multiple training sessions with reset", () => {
      const { result } = renderHook(() => useTrainingStore());

      // First session
      act(() => {
        result.current.setTrainingSelection("PLAN");
        result.current.setTrainingStartTime(1000);
        result.current.addSkillTime("SWR", 30000);
      });

      expect(result.current.selection).toBe("PLAN");
      expect(result.current.time.skill.SWR).toBe(30000);

      // Reset for next session
      act(() => {
        result.current.clearTraining();
      });

      expect(result.current.time.start).toBeUndefined();
      expect(result.current.time.skill.SWR).toBe(0);

      // Second session
      act(() => {
        result.current.setTrainingStartTime(2000);
        result.current.addSkillTime("CARDIO", 20000);
      });

      expect(result.current.time.start).toBe(2000);
      expect(result.current.time.skill.CARDIO).toBe(20000);
      expect(result.current.time.skill.SWR).toBe(0);
    });

    it("should accumulate data across different state updates", () => {
      const { result } = renderHook(() => useTrainingStore());

      // Multiple state updates without reset
      act(() => {
        result.current.setTrainingSelection("PREV");
        result.current.setEquipment(["dumbbells"]);
        result.current.addSkillTime("PREVENTION", 5000);
      });

      act(() => {
        result.current.setEquipment(["dumbbells", "barbell"]);
        result.current.addSkillTime("PREVENTION", 3000);
      });

      act(() => {
        result.current.setTrainingStartTime(1000);
        result.current.addSkillTime("PREVENTION", 2000);
      });

      expect(result.current.selection).toBe("PREV");
      expect(result.current.equipment).toEqual(["dumbbells", "barbell"]);
      expect(result.current.time.skill.PREVENTION).toBe(10000);
      expect(result.current.time.start).toBe(1000);
    });

    it("should maintain independent state for multiple hooks", () => {
      const { result: hook1 } = renderHook(() => useTrainingStore());
      const { result: hook2 } = renderHook(() => useTrainingStore());

      // Both hooks share same store
      act(() => {
        hook1.current.setTrainingSelection("PLAN");
      });

      expect(hook2.current.selection).toBe("PLAN");

      act(() => {
        hook2.current.addSkillTime("SWR", 10000);
      });

      expect(hook1.current.time.skill.SWR).toBe(10000);
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================

  describe("Edge cases", () => {
    it("should handle very large time values", () => {
      const { result } = renderHook(() => useTrainingStore());
      const largeTime = Number.MAX_SAFE_INTEGER;

      act(() => {
        result.current.setTrainingStartTime(largeTime);
      });

      expect(result.current.time.start).toBe(largeTime);
    });

    it("should handle rapid successive updates", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addSkillTime("SWR", 1000);
        }
      });

      expect(result.current.time.skill.SWR).toBe(100000);
    });

    it("should handle updating null exercise list without error", () => {
      const { result } = renderHook(() => useTrainingStore());

      act(() => {
        result.current.setExerciseList(null);
        result.current.setExerciseFeedback("10", "SUCCEEDED");
        result.current.setExerciseSkipped("10");
      });

      expect(result.current.exerciseList).toBeNull();
    });

    it("should handle unknown exercise ids", () => {
      const { result } = renderHook(() => useTrainingStore());
      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: "10",
          skill: "SWR1",
          feedback: { difficulty: null },
          skipped: false,
        },
      ];

      act(() => {
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
  const persistedAtVersionZero = {
    selection: "QUICK",
    exerciseList: [
      {
        skill: "SWR1",
        exerciseId: "10",
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
    activeExerciseIndex: 2,
    tempMaxValues: null,
  };

  it("preserves user data persisted at legacy version 0", () => {
    const result = migrateTrainingStore(persistedAtVersionZero, 0);

    expect(result).toEqual({
      ...persistedAtVersionZero,
      trainingViewMode: null,
      completedExerciseIndices: [],
    });
  });

  it("applies the v14 -> v15 migration when persisted at v14", () => {
    const result = migrateTrainingStore(persistedAtVersionZero, 14);

    expect(result).toEqual({
      ...persistedAtVersionZero,
      trainingViewMode: null,
      completedExerciseIndices: [],
    });
  });

  it("returns state unchanged when already at the registered version", () => {
    const persistedAtCurrentVersion = {
      ...persistedAtVersionZero,
      trainingViewMode: null,
      completedExerciseIndices: [],
    };

    const result = migrateTrainingStore(persistedAtCurrentVersion, 15);

    expect(result).toEqual(persistedAtCurrentVersion);
  });

  it("resets to defaults for unknown ancient versions", () => {
    const result = migrateTrainingStore(persistedAtVersionZero, 5);

    expect(result.selection).toBeNull();
    expect(result.activeExerciseIndex).toBe(0);
    expect(result.tempMaxValues).toBeNull();
    expect(result.time.start).toBeUndefined();
  });

  it("resets to defaults for non integer versions", () => {
    const result = migrateTrainingStore(persistedAtVersionZero, Number.NaN);

    expect(result.selection).toBeNull();
    expect(result.activeExerciseIndex).toBe(0);
  });
});
