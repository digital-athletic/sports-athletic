// "tags" are or, not and
const MAX = {
    default: {
        10: [
            {
                tags: [
                    "EXERCISE_NAME_SQUAT",
                    "EXERCISE_NAME_DEADLIFT",
                    "EXERCISE_NAME_BENCH_PRESS",
                    "EXERCISE_NAME_ROWING",
                    "EXERCISE_NAME_SHOULDER_PRESS"
                ],
                count: 1
            }
        ],
        20: [
            {
                tags: ["EXERCISE_NAME_SQUAT", "EXERCISE_NAME_DEADLIFT"],
                count: 1,
                support: true
            },
            {
                tags: [
                    "EXERCISE_NAME_BENCH_PRESS",
                    "EXERCISE_NAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            }
        ],
        30: [
            {
                tags: ["EXERCISE_NAME_SQUAT", "EXERCISE_NAME_DEADLIFT"],
                count: 1,
                support: true
            },
            {
                tags: [
                    "EXERCISE_NAME_BENCH_PRESS",
                    "EXERCISE_NAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            },
            {
                tags: ["EXERCISE_NAME_ROWING"],
                count: 1,
                support: true
            }
        ],
        45: [
            {
                tags: ["EXERCISE_NAME_SQUAT", "EXERCISE_NAME_DEADLIFT"],
                count: 2,
                support: true
            },
            {
                tags: [
                    "EXERCISE_NAME_BENCH_PRESS",
                    "EXERCISE_NAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            },
            {
                tags: ["EXERCISE_NAME_ROWING"],
                count: 1,
                support: true
            }
        ]
    },
    professional: {
        15: [
            {
                tags: [
                    "EXERCISE_NAME_SQUAT",
                    "EXERCISE_NAME_DEADLIFT",
                    "EXERCISE_NAME_BENCH_PRESS",
                    "EXERCISE_NAME_ROWING",
                    "EXERCISE_NAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            }
        ],
        30: [
            {
                tags: ["EXERCISE_NAME_SQUAT", "EXERCISE_NAME_DEADLIFT"],
                count: 1,
                support: true
            },
            {
                tags: [
                    "EXERCISE_NAME_BENCH_PRESS",
                    "EXERCISE_NAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            }
        ],
        40: [
            {
                tags: ["EXERCISE_NAME_SQUAT", "EXERCISE_NAME_DEADLIFT"],
                count: 1,
                support: true
            },
            {
                tags: [
                    "EXERCISE_NAME_BENCH_PRESS",
                    "EXERCISE_NAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            },
            {
                tags: ["EXERCISE_NAME_ROWING"],
                count: 1,
                support: true
            }
        ],
        55: [
            {
                tags: ["EXERCISE_NAME_SQUAT", "EXERCISE_NAME_DEADLIFT"],
                count: 2,
                support: true
            },
            {
                tags: [
                    "EXERCISE_NAME_BENCH_PRESS",
                    "EXERCISE_NAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            },
            {
                tags: ["EXERCISE_NAME_ROWING"],
                count: 1,
                support: true
            }
        ]
    }
} as const;

export default MAX;
