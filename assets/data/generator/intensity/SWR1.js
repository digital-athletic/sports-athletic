// @format
const SWR1 = {
    adjustment: {
        duration: {
            default: {
                default: {
                    TOO_EASY: 10,
                    SUCCEEDED: 5,
                    TOO_HARD: -10
                }
            },
            m: {
                advanced: {
                    TOO_EASY: 15,
                    SUCCEEDED: 10,
                    TOO_HARD: -10
                },
                professional: {
                    TOO_EASY: 15,
                    SUCCEEDED: 10,
                    TOO_HARD: -10
                }
            }
        },
        height: {
            default: {
                default: {
                    // TODO check if correct
                    TOO_EASY: 5,
                    SUCCEEDED: 5,
                    TOO_HARD: 5
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
            },
            m: {
                advanced: {
                    TOO_EASY: 3,
                    SUCCEEDED: 2,
                    TOO_HARD: -2
                },
                professional: {
                    TOO_EASY: 3,
                    SUCCEEDED: 2,
                    TOO_HARD: -2
                }
            }
        },
        weight: {
            default: {
                default: {
                    // TODO check if correct
                    TOO_EASY: 5,
                    SUCCEEDED: 5,
                    TOO_HARD: 5
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
                default: 65
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
                default: 75,
                beginner: 75,
                advanced: 80,
                professional: 90
            }
        }
    }
};

export default SWR1;
