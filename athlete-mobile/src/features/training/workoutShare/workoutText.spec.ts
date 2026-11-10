import i18n from "@/i18n";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import {
  createExercise,
  createExerciseData,
} from "@/features/training/utils/testFixtures";
import { buildWorkoutText } from "./workoutText";

const t = i18n.getFixedT("en");

describe("buildWorkoutText: workout text", () => {
  it("lists equipment and every exercise, one line per set when the sets differ", () => {
    const plank = createExerciseData({ id: "plank", displayName: "Plank" });
    const squat = createExerciseData({
      id: "squat",
      displayName: "Goblet Squat",
      tags: ["EQ_DUMBBELL"],
    });
    const lunge = createExerciseData({
      id: "lunge",
      name: "Lunge",
      displayName: null,
    });
    const exerciseList = [
      createExercise({
        exerciseId: "plank",
        skill: "WARMUP",
        set: [1, 1],
        duration: 45,
      }),
      createExercise({
        exerciseId: "squat",
        skill: "SWR1",
        set: [1, 2],
        repetition: 8,
        weight: 10,
      }),
      createExercise({
        exerciseId: "squat",
        skill: "SWR1",
        set: [2, 2],
        repetition: 8,
        weight: 14,
      }),
      createExercise({
        exerciseId: "lunge",
        skill: "SWR1",
        set: [1, 2],
        repetition: 12,
        height: 30,
      }),
      createExercise({
        exerciseId: "lunge",
        skill: "SWR1",
        set: [2, 2],
        repetition: 12,
        height: 30,
      }),
    ];

    const text = buildWorkoutText(
      {
        exerciseList,
        exercises: [plank, squat, lunge],
        place: "GYM",
        maxValues: DEFAULT_MAX_VALUES,
        date: "11/12/2026",
      },
      t,
    );

    expect(text).toBe(
      [
        "Workout 11/12/2026",
        "",
        "Equipment needed",
        "• Dumbbell",
        "",
        "Warm up",
        "1 set",
        "Plank: 45 seconds",
        "",
        "Muscle development",
        "2 sets",
        "Goblet Squat",
        "   Set 1: 8 repetitions, 10.00 kg",
        "   Set 2: 8 repetitions, 14.00 kg",
        "2 sets",
        "Lunge: 12 repetitions, 30 cm",
      ].join("\n"),
    );
  });

  it("lists a superset under one set count", () => {
    const deadlift = createExerciseData({
      id: "deadlift",
      displayName: "Deadlift",
    });
    const jump = createExerciseData({ id: "jump", displayName: "Box Jump" });
    const exerciseList = [
      createExercise({
        exerciseId: "deadlift",
        skill: "MAX_STRENGTH",
        set: [1, 2],
        repetition: 3,
      }),
      createExercise({
        exerciseId: "jump",
        skill: "MAX_STRENGTH",
        set: [1, 2],
        repetition: 5,
      }),
      createExercise({
        exerciseId: "deadlift",
        skill: "MAX_STRENGTH",
        set: [2, 2],
        repetition: 3,
      }),
      createExercise({
        exerciseId: "jump",
        skill: "MAX_STRENGTH",
        set: [2, 2],
        repetition: 5,
      }),
    ];

    const text = buildWorkoutText(
      {
        exerciseList,
        exercises: [deadlift, jump],
        place: "GYM",
        maxValues: DEFAULT_MAX_VALUES,
        date: "11/12/2026",
      },
      t,
    );

    expect(text).toContain(
      ["2 sets", "Deadlift: 3 repetitions", "Box Jump: 5 repetitions"].join(
        "\n",
      ),
    );
  });
});
