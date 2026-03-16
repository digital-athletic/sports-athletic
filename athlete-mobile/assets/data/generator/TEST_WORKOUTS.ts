/*
 * 25: Kniebeuge mit LH SWR Level 2 (Squat)
 * 50: LH Kreuzheben SWR (Deadlift)
 * 54: LH Schulterfrontdruecken SWR (Shoulder Press)
 * 297: LH Rudern mit Untergriff SWR (Bent-over Row)
 * 342: LH Bankdruecken SWR (Bench Press)
 *
 */

/**
 * Use these exercise combinations as test workout with 1 set warm-up and 2 sets for measuring
 *
 * @type {{PROFESSIONAL: {default: string[]}, BEGINNER: {default: string[]}, ADVANCED: {default: string[]}}}
 */
const TEST_WORKOUTS = {
    BEGINNER: {
        default: ["25", "50", "342", "297", "54"]
    },
    ADVANCED: {
        default: ["25", "50", "342", "297", "54"]
    },
    PROFESSIONAL: {
        default: ["25", "50", "342", "297", "54"]
    }
} as const;

export default TEST_WORKOUTS;
