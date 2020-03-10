// @format
const SK = {
    adjustment: {
        repetition: {
            default: {
                default: {
                    TOO_EASY: 1,
                    SUCCEEDED: 1,
                    TOO_HARD: -2
                }
            }
        },
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
                default: 40,
                beginner: 40,
                advanced: 50,
                professional: 50
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
                default: 55,
                beginner: 55,
                advanced: 65,
                professional: 70
            },
            type: {
                type: "weightFMax"
            }
        }
    }
};

export default SK;
