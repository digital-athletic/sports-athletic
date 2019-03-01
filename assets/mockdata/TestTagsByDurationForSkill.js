const TestTagsByDurationForSkill = {
    WU: {
        default: {
            5: {
                oberkoerper: 3,
                unterkoerper: 1,
                ganzkoerper: 1
            }
        }
    },
    PREVSHOULDER: {
        default: {
            5: { oberkoerper: 2 },
            15: { oberkoerper: 6 }
        }
    },
    PREVKNEE: {
        default: {
            5: { unterkoerper: 2 },
            10: { unterkoerper: 4 },
            15: { unterkoerper: 6 }
        }
    },
    BAS: {
        default: {
            5: {
                unterkoerper: 2
            }
        }
    },
    CD: {
        default: {
            5: {
                oberkoerper: 3,
                unterkoerper: 3
            }
        }
    },
    BR: {
        default: {
            5: {
                unterkoerper: 4,
                oberkoerper: 2
            }
        }
    },
    MAX: {
        default: {
            5: {
                oberkoerper: 5
            },
            //TODO Sonderlösung Array of Tags für Reihenfolge und feste Übungen (Array or), support (für vorherige
            20: {
                oberkoerper: 5
            }
        }
    },
    SA: {
        default: {
            5: {
                unterkoerper: 5
            },
            20: {
                oberkoerper: 2,
                unterkoerper: 2
            }
        }
    },
    MOB: {
        default: {
            5: {
                oberkoerper: 3,
                unterkoerper: 3
            },
            10: {
                oberkoerper: 5,
                unterkoerper: 5
            }
        }
    },
    ZONE_2: {
        default: {
            15: {
                cardio2: 3
            },
            30: {
                cardio2: 3
            }
        }
    },
    ZONE_1: {
        default: {
            15: {
                cardio1s: 3
            },
            30: {
                cardio1s: 3
            }
        }
    },
    ZONE_1_LAKTAT: {
        default: {
            15: {
                cardio1: 3
            },
            30: {
                cardio1: 3
            }
        }
    },
    SWR1KG: {
        default: {
            20: {
                oberkoerper: 2,
                unterkoerper: 2,
                rumpf: 2
            },
            25: {},
            30: {
                oberkoerper: 3,
                unterkoerper: 3,
                rumpf: 2
            }
        }
    },
    SWR2KG: {
        default: {
            20: {}
        }
    },
    SWR1: {
        default: {
            20: {
                oberkoerper: 2,
                unterkoerper: 2,
                rumpf: 2
            },
            25: {
                oberkoerper: 3,
                unterkoerper: 3,
                rumpf: 2
            },
            30: {
                oberkoerper: 4,
                unterkoerper: 3,
                rumpf: 3
            },
            35: {
                oberkoerper: 4,
                unterkoerper: 4,
                rumpf: 3
            }
        }
    },
    //TODO: special tags for fixed exercises!?
    SWR2: {
        default: {
            20: {
                squat: 1,
                firstPair2: 1,
                secondPair1: 1,
                secondPair2: 1,
                thirdPair1: 1,
                thirdPair2: 1
            },
            25: {
                firstPair1: 1,
                firstPair2: 1,
                secondPair1: 1,
                secondPair2: 1,
                thirdPair1: 1,
                thirdPair2: 1,
                rumpf: 1
            },
            30: {
                firstPair1: 1,
                firstPair2: 1,
                secondPair1: 1,
                secondPair2: 1,
                thirdPair1: 1,
                thirdPair2: 1,
                rumpf: 2
            },
            35: {
                firstPair1: 1,
                firstPair2: 1,
                secondPair1: 1,
                secondPair2: 1,
                thirdPair1: 1,
                thirdPair2: 1,
                rumpf: 2,
                oberkoerper: 1,
                unterkoerper: 1
            },
            40: {
                firstPair1: 1,
                firstPair2: 1,
                secondPair1: 1,
                secondPair2: 1,
                thirdPair1: 1,
                thirdPair2: 1,
                rumpf: 3,
                oberkoerper: 1,
                unterkoerper: 1
            },
            45: {
                firstPair1: 1,
                firstPair2: 1,
                secondPair1: 1,
                secondPair2: 1,
                thirdPair1: 1,
                thirdPair2: 1,
                rumpf: 4,
                oberkoerper: 1,
                unterkoerper: 1
            }
        },
        pause: {
            20: {
                oberkoerper: 2,
                unterkoerper: 2,
                rumpf: 2
            },
            25: {
                oberkoerper: 3,
                unterkoerper: 3,
                rumpf: 2
            },
            30: {
                oberkoerper: 4,
                unterkoerper: 3,
                rumpf: 3
            },
            35: {
                oberkoerper: 4,
                unterkoerper: 4,
                rumpf: 3
            }
        }
    }
};

export default TestTagsByDurationForSkill;
