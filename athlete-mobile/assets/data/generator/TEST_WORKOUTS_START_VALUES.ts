/*
 * 7: Bankdrücken mit 2 KH SWR
 * 25: Kniebeuge mit LH SWR Level 2
 * 54: LH Schulterfrontdrücken SWR
 * 88: Rudern mit 2 KH vorgebeugt (Level 1) SWR
 * 251: Kniebeuge mit 2 KH SWR - DERZEIT NICHT GENUTZT
 * 297: LH Rudern mit Untergriff SWR + Testeinheit
 * 315: KH Schulterdrücken eng sitzend SWR(Präv) + Präv + Testeinheit (Präv)
 * 317: KH Schulterdrücken (sitzend) SWR + Testeinheit
 * 342: LH Bankdrücken SWR + Testeinheit
 * 355: KH Bankdrücken eng  SWR(Präv) + Präv + Testeinheit
 *
 */

const START_VALUES = {
    "7": {
        w: {
            beginner: 7,
            advanced: 10,
            professional: 12.5
        },
        m: {
            beginner: 12.5,
            advanced: 17.5,
            professional: 22.5
        }
    },
    "25": {
        w: {
            beginner: 25,
            advanced: 35,
            professional: 45
        },
        m: {
            beginner: 35,
            advanced: 50,
            professional: 65
        }
    },
    "54": {
        w: {
            professional: 20
        },
        m: {
            advanced: 25,
            professional: 30
        }
    },
    "88": {
        w: {
            beginner: 8,
            advanced: 10,
            professional: 12.5
        },
        m: {
            beginner: 12.5,
            advanced: 17.5,
            professional: 22.5
        }
    },
    "297": {
        w: {
            advanced: 22.5,
            professional: 30
        },
        m: {
            beginner: 30,
            advanced: 40,
            professional: 50
        }
    },
    "315": {
        w: {
            beginner: 5,
            advanced: 7,
            professional: 8
        },
        m: {
            beginner: 9,
            advanced: 12.5,
            professional: 15
        }
    },
    "317": {
        w: {
            beginner: 5,
            advanced: 7,
            professional: 8
        },
        m: {
            beginner: 9,
            advanced: 12.5,
            professional: 15
        }
    },
    "342": {
        w: {
            advanced: 22.5,
            professional: 27.5
        },
        m: {
            beginner: 30,
            advanced: 40,
            professional: 50
        }
    },
    "355": {
        w: {
            beginner: 6,
            advanced: 7,
            professional: 9
        },
        m: {
            beginner: 9,
            advanced: 12.5,
            professional: 17.5
        }
    }
} as const;

export default START_VALUES;
