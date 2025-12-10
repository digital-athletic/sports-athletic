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
        height: {
            default: {
                default: {
                    TOO_EASY: 10,
                    SUCCEEDED: 5,
                    TOO_HARD: -5
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
        duration: {
            default: {
                default: 30
            }
        },
        repetition: {
            default: {
                default: 5
            }
        },
        height: {
            default: {
                default: 20
            }
        },
        weight: {
            default: {
                default: 40
            },
            type: {
                type: "weighFMax"
            }
        }
    },
    targetValue: {
        duration: {
            default: {
                default: 45
            }
        },
        repetition: {
            default: {
                default: 8
            }
        },
        height: {
            default: {
                default: 40
            }
        },
        weight: {
            default: {
                default: 60
            },
            type: {
                type: "weighFMax"
            }
        }
    }
} as const;

export default DEFAULT;
