const SkillPriorities = {
    CHILD: {
        pain: {
            phase: {
                0: ["PHASE", "PREV1", "WUSPEZIAL"],
                20: ["PREV2"],
                30: ["PREV3"],
                40: ["WU"]
            }
        },
        noPain: {
            phase: {
                0: ["PHASE", "WU"],
                20: ["BAS"],
                25: ["GKS"],
                40: ["CD"]
            }
        }
    },
    ADULT: {
        pain: {
            combined: {
                0: ["PHASE", "HBCARDIO", "PREV1", "WUSPEZIAL"],
                30: ["MOB"],
                45: ["WU"],
                60: ["CD"]
            },
            phase: {
                0: ["PHASE", "PREV1", "WUSPEZIAL", "MOB"],
                30: ["WU"],
                45: ["CD"],
                60: ["BR"]
            },
            cardio: {
                0: ["HBCARDIO", "PREV2", "WUSPEZIAL", "MOB"],
                30: ["BR"],
                45: ["CD"],
                60: ["WU"]
            },
            stability: {
                0: ["PREV3", "WUSPEZIAL", "GKS", "BAS", "MOB"],
                30: ["WU"],
                45: ["CD"],
                60: ["BR"]
            }
        },
        noPain: {
            combined: {
                0: ["PHASE", "HBCARDIO"],
                30: ["MOB"],
                45: ["WU"],
                60: ["CD"]
            },
            phase: {
                0: ["PHASE", "MOB"],
                30: ["WU"],
                45: ["CD"],
                60: ["BR"]
            },
            cardio: {
                0: ["HBCARDIO", "MOB"],
                30: ["BR"],
                45: ["CD"],
                60: ["WU"]
            },
            stability: {
                0: ["GKS", "BAS", "MOB"],
                30: ["WU"],
                45: ["CD"],
                60: ["BR"]
            }
        }
    }
};

export default SkillPriorities;
