const TestTagsByDurationForSkill = {
    PREV: {},
    MAX: {
        default: {
            5: {
                oberkoerper: 5
            }
        }
    },
    SA: {
        default: {
            5: {
                unterkoerper: 5
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
    HBCARDIO: {
        default: {
            15: {
                cardio: 3
            }
        }
    },
    SWR1KG: {
        default: {
            15: {},
            20: {},
            25: {},
            30: {}
        }
    },
    SWR2KG: {
        default: {}
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
                firstPair1: 1,
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
