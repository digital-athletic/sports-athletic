// @format
const DEFAULT = {
    adjustment: {
        duration: {
            default: {
                default: {
                    TOO_EASY: 10,
                    SUCCEEDED: 5,
                    TOO_HARD: -10
                }
            }
        },
        repetition: {
            default: {
                default: {
                    TOO_EASY: 2,
                    SUCCEEDED: 1,
                    TOO_HARD: -2
                }
            }
        },
        weight: {
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
        duration: {
            default: {
                default: 30
            }
        },
        repetition: {
            default: {
                default: 8
            }
        }
    },
    targetValue: {
        duration: {
            default: {
                default: 60
            }
        },
        repetition: {
            default: {
                default: 15
            }
        }
    }
};

export default DEFAULT;
