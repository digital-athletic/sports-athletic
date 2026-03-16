/*
 * 25: Kniebeuge mit LH SWR Level 2 (Squat)
 * 50: LH Kreuzheben SWR (Deadlift)
 * 54: LH Schulterfrontdruecken SWR (Shoulder Press)
 * 297: LH Rudern mit Untergriff SWR (Bent-over Row)
 * 342: LH Bankdruecken SWR (Bench Press)
 *
 */

const START_VALUES = {
    "25": {
        w: {
            beginner: 30,
            advanced: 45,
            professional: 60
        },
        m: {
            beginner: 40,
            advanced: 60,
            professional: 80
        }
    },
    "50": {
        w: {
            beginner: 30,
            advanced: 45,
            professional: 60
        },
        m: {
            beginner: 40,
            advanced: 60,
            professional: 80
        }
    },
    "342": {
        w: {
            beginner: 20,
            advanced: 25,
            professional: 30
        },
        m: {
            beginner: 35,
            advanced: 50,
            professional: 60
        }
    },
    "297": {
        w: {
            beginner: 20,
            advanced: 30,
            professional: 35
        },
        m: {
            beginner: 30,
            advanced: 45,
            professional: 55
        }
    },
    "54": {
        w: {
            beginner: 15,
            advanced: 20,
            professional: 25
        },
        m: {
            beginner: 25,
            advanced: 30,
            professional: 40
        }
    }
} as const;

export default START_VALUES;
