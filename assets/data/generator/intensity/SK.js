// @format
const SK = {
    adjustment: {
        weight: {
            default: {
                default: {
                    TOO_EASY: 2.5,
                    SUCCEEDED: 1.25,
                    TOO_HARD: -2.5
                }
            }
        }
    },
    startValue: {
        repetition: {
            default: {
                default: 6
            }
        },
        weight: {
            default: {
                default: 40
            }
        }
    },
    targetValue: {
        repetition: {
            default: {
                default: 6
            }
        },
        weight: {
            default: {
                default: 70
            }
        }
    }
};

export default SK;
