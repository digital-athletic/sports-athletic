// @format
const SWR1KG = {
    adjustment: {
        duration: {
            default: {
                default: {
                    TOO_EASY: 10,
                    SUCCEEDED: 10,
                    TOO_HARD: -10
                },
                beginner: {
                    TOO_EASY: 10,
                    SUCCEEDED: 10,
                    TOO_HARD: -10
                },
                advanced: {
                    TOO_EASY: 15,
                    SUCCEEDED: 10,
                    TOO_HARD: -10
                },
                professional: {
                    TOO_EASY: 20,
                    SUCCEEDED: 10,
                    TOO_HARD: -10
                }
            },
            k: {
                default: {
                    TOO_EASY: 10,
                    SUCCEEDED: 5,
                    TOO_HARD: -15
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
                },
                beginner: {
                    TOO_EASY: 2,
                    SUCCEEDED: 1,
                    TOO_HARD: -2
                },
                advanced: {
                    TOO_EASY: 3,
                    SUCCEEDED: 2,
                    TOO_HARD: -2
                },
                professional: {
                    TOO_EASY: 4,
                    SUCCEEDED: 2,
                    TOO_HARD: -2
                }
            },
            k: {
                default: {
                    TOO_EASY: 2,
                    SUCCEEDED: 1,
                    TOO_HARD: -3
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
            },
            k: {
                default: 30
            },
            m: {
                default: 40,
                advanced: 45,
                professional: 45
            },
            w: {
                default: 30
            }
        },
        height: {
            default: {
                default: 20
            }
        },
        repetition: {
            default: {
                default: 7
            },
            k: {
                default: 7
            },
            m: {
                default: 10,
                advanced: 12,
                professional: 12
            },
            w: {
                default: 7,
                professional: 8
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
} as const;

export default SWR1KG;
