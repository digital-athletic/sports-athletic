interface ExampleWorkout {
  user_id: string;
  workout_id: string;
  workout_date: number;
  duration: number;
  exercise_count: number;
  xp_earned: number;
  moved_weight: number;
  exercises: { exerciseId: number; repetition: number; weight: number; duration: number }[];
  training_type: string;
  training_focus: string;
}

export function generateExampleWorkoutData(userId: string): ExampleWorkout[] {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  return [
    {
      user_id: userId,
      workout_id: `example-workout-${now}-1`,
      workout_date: now - 180 * dayInMs, // ~6 months ago (last year, not last month)
      duration: 1800,
      exercise_count: 8,
      xp_earned: 150,
      moved_weight: 1250.5,
      exercises: [
        { exerciseId: 101, repetition: 12, weight: 20, duration: 45 },
        { exerciseId: 102, repetition: 10, weight: 25, duration: 50 },
        { exerciseId: 103, repetition: 15, weight: 15, duration: 40 },
      ],
      training_type: "PLAN",
      training_focus: "STABILITY",
    },
    {
      user_id: userId,
      workout_id: `example-workout-${now}-2`,
      workout_date: now - 15 * dayInMs, // ~2 weeks ago (last month, not last week)
      duration: 2400,
      exercise_count: 10,
      xp_earned: 200,
      moved_weight: 1800.0,
      exercises: [
        { exerciseId: 201, repetition: 8, weight: 30, duration: 60 },
        { exerciseId: 202, repetition: 12, weight: 20, duration: 45 },
        { exerciseId: 203, repetition: 10, weight: 25, duration: 55 },
      ],
      training_type: "QUICK",
      training_focus: "GKS",
    },
    {
      user_id: userId,
      workout_id: `example-workout-${now}-3`,
      workout_date: now, // today
      duration: 1500,
      exercise_count: 6,
      xp_earned: 120,
      moved_weight: 950.25,
      exercises: [
        { exerciseId: 301, repetition: 20, weight: 10, duration: 30 },
        { exerciseId: 302, repetition: 15, weight: 12, duration: 35 },
      ],
      training_type: "PREV",
      training_focus: "PREVSHOULDER",
    },
  ];
}
