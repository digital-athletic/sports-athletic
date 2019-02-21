const TestSkillTree = {
    SWR1: {
        105: {
            tags: ["oberkoerper", "noEQ"],
            levels: {
                0: {
                    name: "einfache Liegestütz"
                },
                1: {
                    name: "einarmige Liegestütz"
                },
                3: {
                    name: "gesprungene Liegstütz"
                }
            }
        },
        106: {
            tags: ["oberkoerper"],
            levels: {
                1: {
                    name: "KH Schulterdrücken mit Rotation sitzend SWR1"
                },
                2: {}
            }
        },
        107: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Frontheben mit KH (Druck)" } }
        },

        108: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "LH Bankdrücken" } }
        },
        101: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Ausfallschritt mit LH statisch li und re" } }
        },
        102: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Kniebeuge mit 2 KH" } }
        },
        103: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Wadenheben mit 2 KH auf Gewichtsscheibe" } }
        },
        100: {
            tags: ["rumpf"],
            levels: { 1: { name: "Kreuzheben mit LH (gestreckte Beine)" } }
        },
        104: {
            tags: ["rumpf"],
            levels: { 1: { name: "Rumpfrotation am Boden mit KH" } }
        },
        109: {
            tags: ["rumpf"],
            levels: { 1: { name: "Rumpfseitneigen mit KH li und re" } }
        }
    },
    MOB: {
        120: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Wirbelsäulen-Rotation" } }
        },
        121: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Schulter-Brücke" } }
        },
        122: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Schulterwischen am Boden li und re" } }
        },
        123: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Schulterpendel an Wand li/re" } }
        },
        124: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Schwertziehen li/re" } }
        },
        125: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Sprunggelenksmobilität an Wand li und re" } }
        },
        126: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "GoGo Squat" } }
        },
        127: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Hüftrotation im Stehen li/re" } }
        },
        128: {
            tags: ["unterkoerper"],
            levels: {
                1: { name: "tiefe Kniebeuge mit Ball und Armen über Kopf" }
            }
        },
        129: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Kniebeugen Serie" } }
        }
    },
    SWR1KG: {
        1: {
            tags: [],
            levels: {}
        }
    },
    CARDIO2: {
        138: {
            tags: ["cardio2"],
            levels: {
                1: { name: "Laufband (schnelles Laufen)" }
            }
        },
        139: {
            tags: ["cardio2"],
            levels: {
                1: {
                    name: "Rechteck-Lauf"
                }
            }
        },
        132: {
            tags: ["cardio2"],
            levels: {
                1: {
                    name: "20 m Linienläufe"
                }
            }
        }
    },
    CARDIO1S: {
        1: {
            tags: [],
            levels: {}
        }
    },
    CARDIO1: {
        1: {
            tags: ["cardio1"],
            levels: {
                1: { name: "Laufband (sehr schnelles Laufen)" }
            }
        }
    },
    SWR2: {
        1: {
            tags: [],
            levels: {}
        }
    },
    PREVSHOULDER: {
        160: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Schulterwischen am Boden li und re" } }
        },
        162: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Schulterpendel an Wand li und re" } }
        },
        164: {
            tags: ["oberkoerper"],
            levels: {
                1: { name: "Schulterblattaktivierung im Unterarmstütz Level 1" }
            }
        },
        166: {
            tags: ["oberkoerper"],
            levels: {
                1: {
                    name: "Seitstütz mit Oberkörperrotation Level 1 li und re"
                }
            }
        },
        167: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Unterarmstütz" } }
        },
        168: {
            tags: ["oberkoerper"],
            levels: {
                1: { name: "Mobilität Schulter in Rückenlage li und re" }
            }
        }
    },
    PREVKNEE: {
        111: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "tiefe Kniebeuge" } }
        },
        113: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Wadenheben mit KG" } }
        },
        114: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Wadenheben aufgestützt (volle Bewegung)" } }
        },
        116: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "exzentrische Kniebeuge (li und re)" } }
        },
        119: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "halbe einbeinige Kniebeuge li und re" } }
        },
        118: {
            tags: ["unterkoerper"],
            levels: {
                1: {
                    name: "GoGo Squat bzw. Tiefkniebeuge mit festhalten an Bank"
                }
            }
        }
    },
    BAS: {
        131: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "seitliche Sprünge beidbeinig" } }
        },
        133: {
            tags: ["unterkoerper"],
            levels: {
                1: {
                    name:
                        "Einbeinstand mit Handballwurf gegen Wand und Beinwechsel li/re"
                }
            }
        }
    },
    BR: {
        142: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Po mit Rolle li und re" } }
        },
        143: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Beininnenseite mit Rolle li und re" } }
        },
        144: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Wade mit Rolle li und re" } }
        },
        145: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Schienbein mit Rolle li und re" } }
        },
        148: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Schulterblatt mit Ball li und re" } }
        },
        149: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Brust mit Ball li und re" } }
        }
    },
    MAX: {
        1: {
            tags: [],
            levels: {}
        }
    },
    SA: {
        1: {
            tags: [],
            levels: {}
        }
    },
    WU: {
        170: {
            tags: ["ganzkoerper"],
            levels: {
                1: {
                    name:
                        "Rumpfrotation im Ausfallschritt mit Ellenbogen zum Boden li und re"
                }
            }
        },
        171: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Schulter-Brücke" } }
        },
        172: {
            tags: ["oberkoerper"],
            levels: {
                1: { name: "Schulterblattaktivierung im Unterarmstütz Level 1" }
            }
        },
        173: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Wallslide an Wand sitzend" } }
        },
        174: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "seitlicher Ausfallschritt statisch li/re" } }
        }
    },
    CD: {
        151: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Dehnung Schienbeinvorderseite li und re" } }
        },
        155: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "weltbeste Übung li/re" } }
        },
        156: {
            tags: ["unterkoerper"],
            levels: { 1: { name: "Adduktoren (1) li und re" } }
        },
        153: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Der Bogen li und re" } }
        },
        159: {
            tags: ["oberkoerper"],
            levels: {
                1: { name: "Dehnung/Mobilisation der Schulterinnenrotation" }
            }
        },
        158: {
            tags: ["oberkoerper"],
            levels: { 1: { name: "Pferderücken und Katzenbuckel" } }
        }
    }
};

export default TestSkillTree;
