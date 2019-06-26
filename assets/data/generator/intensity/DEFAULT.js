// @format
const DEFAULT = {
    adjustment: {
        duration: {
            default: {
                default: {
                    TOO_EASY: 10,
                    SUCCEEDED: 5,
                    TOO_HARD: -5
                }
            }
        },
        height: {
            default: {
                default: {
                    TOO_EASY: 10,
                    SUCCEEDED: 5,
                    TOO_HARD: -5
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
                    TOO_EASY: 5,
                    SUCCEEDED: 2,
                    TOO_HARD: -2
                }
            }
        }
    },
    startValue: {
        duration: {
            default: {
                default: 50
            }
        },
        height: {
            default: {
                default: 20
            }
        },
        repetition: {
            default: {
                default: 12
            }
        },
        weight: {
            default: {
                default: 10
            }
        }
    },
    targetValue: {
        duration: {
            default: {
                default: 80
            }
        },
        height: {
            default: {
                default: 40
            }
        },
        repetition: {
            default: {
                default: 20
            }
        },
        weight: {
            default: {
                default: 20
            }
        }
    }
};

export default DEFAULT;
