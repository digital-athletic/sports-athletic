const SkillPriorities = {
    CHILD: {
        pain: {
            1: [
                {
                    0: ["PHASE", "PREV1"],
                    30: ["PREV2", "BAS"],
                    45: ["PREV3", "GKS"],
                    60: ["WU"]
                }
            ]
        },
        noPain: {
            1: [
                {
                    0: ["PHASE", "WU"],
                    30: ["BAS"],
                    45: ["GKS"],
                    60: ["CD"]
                }
            ]
        }
    },
    ADULT: {
        combined: {
            1: [
                {
                    0: ["PHASE", "PREV1", "MOB"],
                    30: ["HBCARDIO"],
                    45: ["WU"],
                    60: ["CD"]
                }
            ]
        },
        pain: {
            1: [
                {
                    0: ["PHASE", "PREV1", "MOB"],
                    30: ["WU"],
                    45: ["CD"],
                    60: ["BR"]
                }
            ],
            2: [
                {
                    0: ["PHASE", "PREV1", "MOB"],
                    30: ["WU"],
                    45: ["CD"],
                    60: ["BR"]
                },
                {
                    0: ["HBCARDIO", "PREV2", "MOB"],
                    30: ["BAS"],
                    45: ["BR"],
                    60: ["CD"]
                }
            ],
            3: [
                {
                    0: ["PHASE", "PREV3", "MOB"],
                    30: ["WU"],
                    45: ["CD"],
                    60: ["BR"]
                },
                {
                    0: ["HBCARDIO", "PREV2", "MOB"],
                    30: ["BR"],
                    45: ["CD"],
                    60: ["WU"]
                },
                {
                    0: ["PREV1", "GKS", "BAS", "MOB"],
                    30: ["WU"],
                    45: ["CD"],
                    60: ["BR"]
                }
            ]
        },
        noPain: {
            1: [
                {
                    0: ["PHASE", "HBCARDIO"],
                    30: ["MOB"],
                    45: ["WU"],
                    60: ["CD", "BR"]
                }
            ],
            2: [
                {
                    0: ["PHASE", "MOB"],
                    30: ["WU"],
                    45: ["CD"],
                    60: ["BR"]
                },
                {
                    0: ["HBCARDIO", "BAS", "GKS"],
                    30: ["MOB"],
                    45: ["BR"],
                    60: ["CD", "WU"]
                }
            ],
            3: [
                {
                    0: ["PHASE", "MOB"],
                    30: ["WU"],
                    45: ["CD"],
                    60: ["BR"]
                },
                {
                    0: ["HBCARDIO", "MOB"],
                    30: ["BR"],
                    45: ["CD"],
                    60: ["WU"]
                },
                {
                    0: ["GKS", "BAS", "MOB"],
                    30: ["WU"],
                    45: ["CD"],
                    60: ["BR"]
                }
            ]
        }
    }
};

export default SkillPriorities;
