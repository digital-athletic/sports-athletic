// @format
const SK = {
    adjustment: {
        weightFMax: {
            default: {
                default: {
                    TOO_EASY: 5,
                    SUCCEEDED: 2.5,
                    TOO_HARD: -2.5
                }
            }
        },
        weightAbsolute: {
            default: {
                default: {
                    TOO_EASY: 2,
                    SUCCEEDED: 1,
                    TOO_HARD: -1
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
            },
            type: {
                type: "weightFMax"
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
            },
            type: {
                type: "weightFMax"
            }
        }
    }
};

export default SK;
