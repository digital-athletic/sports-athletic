// "tags" are or, not and
const MAX = {
    default: {
        10: [
            {
                tags: [
                    "EXERCISENAME_SQUAT",
                    "EXERCISENAME_DEADLIFT",
                    "EXERCISENAME_BENCH_PRESS",
                    "EXERCISENAME_ROWING",
                    "EXERCISENAME_SHOULDER_PRESS"
                ],
                count: 1
            }
        ],
        20: [
            {
                tags: ["EXERCISENAME_SQUAT", "EXERCISENAME_DEADLIFT"],
                count: 1,
                support: true
            },
            {
                tags: [
                    "EXERCISENAME_BENCH_PRESS",
                    "EXERCISENAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            }
        ],
        30: [
            {
                tags: ["EXERCISENAME_SQUAT", "EXERCISENAME_DEADLIFT"],
                count: 1,
                support: true
            },
            {
                tags: [
                    "EXERCISENAME_BENCH_PRESS",
                    "EXERCISENAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            },
            {
                tags: ["EXERCISENAME_ROWING"],
                count: 1,
                support: true
            }
        ],
        45: [
            {
                tags: ["EXERCISENAME_SQUAT", "EXERCISENAME_DEADLIFT"],
                count: 2,
                support: true
            },
            {
                tags: [
                    "EXERCISENAME_BENCH_PRESS",
                    "EXERCISENAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            },
            {
                tags: ["EXERCISENAME_ROWING"],
                count: 1,
                support: true
            }
        ]
    },
    professional: {
        15: [
            {
                tags: [
                    "EXERCISENAME_SQUAT",
                    "EXERCISENAME_DEADLIFT",
                    "EXERCISENAME_BENCH_PRESS",
                    "EXERCISENAME_ROWING",
                    "EXERCISENAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            }
        ],
        30: [
            {
                tags: ["EXERCISENAME_SQUAT", "EXERCISENAME_DEADLIFT"],
                count: 1,
                support: true
            },
            {
                tags: [
                    "EXERCISENAME_BENCH_PRESS",
                    "EXERCISENAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            }
        ],
        40: [
            {
                tags: ["EXERCISENAME_SQUAT", "EXERCISENAME_DEADLIFT"],
                count: 1,
                support: true
            },
            {
                tags: [
                    "EXERCISENAME_BENCH_PRESS",
                    "EXERCISENAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            },
            {
                tags: ["EXERCISENAME_ROWING"],
                count: 1,
                support: true
            }
        ],
        55: [
            {
                tags: ["EXERCISENAME_SQUAT", "EXERCISENAME_DEADLIFT"],
                count: 2,
                support: true
            },
            {
                tags: [
                    "EXERCISENAME_BENCH_PRESS",
                    "EXERCISENAME_SHOULDER_PRESS"
                ],
                count: 1,
                support: true
            },
            {
                tags: ["EXERCISENAME_ROWING"],
                count: 1,
                support: true
            }
        ]
    }
} as const;

export default MAX;
