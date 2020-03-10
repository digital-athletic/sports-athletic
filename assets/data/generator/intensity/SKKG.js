// @format
const SKKG = {
    adjustment: {
        repetition: {
            default: {
                default: {
                    TOO_EASY: 1,
                    SUCCEEDED: 1,
                    TOO_HARD: -1
                },
                m: {
                    TOO_EASY: 2,
                    SUCCEEDED: 1,
                    TOO_HARD: -1
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
                    TOO_EASY: 1,
                    SUCCEEDED: 0.5,
                    TOO_HARD: -1
                },
                m: {
                    TOO_EASY: 1,
                    SUCCEEDED: 0.5,
                    TOO_HARD: -1
                }
            }
        }
    },
    startValue: {
        repetition: {
            default: {
                default: 3,
                m: 5
            }
        },
        weight: {
            default: {
                default: 1,
                m: 2
            }
        },
        type: {
            type: "weightAbsolute"
        }
    },
    targetValue: {
        repetition: {
            default: {
                default: 6,
                m: 8
            }
        },
        weight: {
            default: {
                default: 3,
                m: 5
            }
        },
        type: {
            type: "weightAbsolute"
        }
    }
};

export default SKKG;
