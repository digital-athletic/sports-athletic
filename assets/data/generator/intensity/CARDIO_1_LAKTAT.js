// @format
const CARDIO_1_LAKTAT = {
    adjustment: {
        repetition: {
            default: {
                default: {
                    TOO_EASY: 1,
                    SUCCEEDED: 1,
                    TOO_HARD: -1
                }
            }
        }
    },
    startValue: {
        repetition: {
            default: {
                default: 2,
                advanced: 2,
                professional: 3
            }
        }
    },
    targetValue: {
        repetition: {
            default: {
                default: 4,
                advanced: 5,
                professional: 6
            }
        }
    }
};

export default CARDIO_1_LAKTAT;
