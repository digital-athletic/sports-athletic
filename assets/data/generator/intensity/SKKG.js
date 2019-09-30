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
        weight: {
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
        }
    }
};

export default SKKG;
