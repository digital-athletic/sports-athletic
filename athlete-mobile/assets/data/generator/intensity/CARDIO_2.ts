// @format
const CARDIO_2 = {
    adjustment: {
        repetition: {
            default: {
                default: {
                    TOO_EASY: 1,
                    SUCCEEDED: 1,
                    TOO_HARD: -2
                }
            }
        }
    },
    startValue: {
        repetition: {
            default: {
                default: 3,
                advanced: 4,
                professional: 6
            }
        }
    },
    targetValue: {
        repetition: {
            default: {
                default: 7,
                advanced: 9,
                professional: 12
            }
        }
    }
} as const;

export default CARDIO_2;
