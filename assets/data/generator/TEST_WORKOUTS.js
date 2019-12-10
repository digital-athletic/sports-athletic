/*
 * 7: Bankdrücken mit 2 KH SWR
 * 25: Kniebeuge mit LH SWR Level 2
 * 54: LH Schulterfrontdrücken SWR
 * 88: Rudern mit 2 KH vorgebeugt (Level 1) SWR
 * 251: Kniebeuge mit 2 KH SWR
 * 297: LH Rudern mit Untergriff SWR + Testeinheit
 * 315: KH Schulterdrücken eng sitzend SWR(Präv) + Präv + Testeinheit (Präv)
 * 317: KH Schulterdrücken (sitzend) SWR + Testeinheit
 * 342: LH Bankdrücken SWR + Testeinheit
 * 355: KH Bankdrücken eng  SWR(Präv) + Präv + Testeinheit
 *
 */

/**
 * Use these exercise combinations as test workout with 1 set warm-up and 2 sets for measuring
 *
 * @type {{PROFESSIONAL: {default: number[]}, BEGINNER: {default: number[]}, ADVANCED: {default: number[], m: number[]}}}
 */
const TEST_WORKOUTS = {
    BEGINNER: {
        default: [25, 7, 88, 317]
    },
    ADVANCED: {
        default: [25, 7, 297, 317],
        m: [25, 342, 297, 54]
    },
    PROFESSIONAL: {
        default: [25, 342, 297, 54]
    }
};

export default TEST_WORKOUTS;
