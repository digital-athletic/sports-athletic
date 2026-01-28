const muscleMBack = [
    {
        name: "CALF_RIGHT",
        width: 0.13,
        height: 0.2,
        top: 0.69,
        right: 0.28,
        transform: [{ rotate: "-10deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/wade_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/wade_re.png")
    },
    {
        name: "CALF_LEFT",
        width: 0.13,
        height: 0.2,
        top: 0.69,
        left: 0.32,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/wade_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/wade_li.png")
    },
    {
        name: "HAMSTRINGS_RIGHT",
        width: 0.11,
        height: 0.15,
        top: 0.54,
        right: 0.367,
        transform: [{ rotate: "-16deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/oberschenkel_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/oberschenkel_re.png")
    },
    {
        name: "HAMSTRINGS_LEFT",
        width: 0.09,
        height: 0.15,
        top: 0.53,
        left: 0.31,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/oberschenkel_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/oberschenkel_li.png")
    },
    {
        name: "INNER_THIGH_REAR_LEFT",
        width: 0.05,
        height: 0.12,
        top: 0.54,
        right: 0.54,
        transform: [{ rotate: "6deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/innererOberschenkel_hinten_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/innererOberschenkel_hinten_li.png")
    },
    {
        name: "OUTER_THIGH_REAR_RIGHT",
        width: 0.06,
        height: 0.19,
        top: 0.44,
        right: 0.33,
        transform: [{ rotate: "-15deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/aeussererOberschenkel_hinten_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/aeussererOberschenkel_hinten_re.png")
    },
    {
        name: "GLUTES",
        width: 0.21,
        height: 0.09,
        top: 0.44,
        left: 0.357,
        transform: [{ rotate: "12deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/gesaess.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/gesaess.png")
    },
    {
        name: "LOWER_BACK",
        width: 0.12,
        height: 0.06,
        top: 0.363,
        right: 0.44,
        left: 0.43,
        transform: [{ rotate: "109deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/untererRuecken.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/untererRuecken.png")
    },
    {
        name: "LATISSIMUS_LEFT",
        width: 0.08,
        height: 0.08,
        top: 0.29,
        left: 0.36,
        transform: [{ rotate: "-10deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/grosserRueckenmuskel_lat.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/grosserRueckenmuskel_lat.png")
    },
    {
        name: "LATISSIMUS_RIGHT",
        width: 0.075,
        height: 0.07,
        top: 0.277,
        right: 0.392,
        transform: [{ rotate: "30deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/grosserRueckenmuskel_lat.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/grosserRueckenmuskel_lat.png")
    },
    {
        name: "UPPER_BACK",
        width: 0.197,
        height: 0.075,
        top: 0.203,
        left: 0.384,
        transform: [{ rotate: "-5deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/obererRuecken.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/obererRuecken.png")
    },
    {
        name: "UPPER_BACK",
        width: 0.079,
        height: 0.04,
        top: 0.275,
        left: 0.45,
        transform: [{ rotate: "-3deg" }],
        backgroundColor: "rgba(0,0,0,0)"
    },
    {
        name: "NECK",
        width: 0.15,
        height: 0.08,
        top: 0.12,
        left: 0.388,
        transform: [{ rotate: "-5deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/nacken.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/nacken.png")
    },
    {
        name: "SHOULDER_LEFT",
        width: 0.09,
        height: 0.03,
        top: 0.21,
        left: 0.28,
        transform: [{ rotate: "-38deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/schulter_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/schulter_li.png")
    },
    {
        name: "SHOULDER_RIGHT",
        width: 0.09,
        height: 0.03,
        top: 0.205,
        right: 0.31,
        transform: [{ rotate: "38deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/schulter_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/schulter_re.png")
    },
    {
        name: "TRICEPS_LEFT",
        width: 0.06,
        height: 0.09,
        top: 0.26,
        left: 0.25,
        transform: [{ rotate: "20deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/armstrecker_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/armstrecker_li.png")
    },
    {
        name: "TRICEPS_RIGHT",
        width: 0.06,
        height: 0.09,
        top: 0.26,
        right: 0.28,
        transform: [{ rotate: "-20deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/armstrecker_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/armstrecker_re.png")
    },
    {
        name: "WRIST_EXTENSOR_LEFT",
        width: 0.06,
        height: 0.1,
        top: 0.36,
        left: 0.19,
        transform: [{ rotate: "20deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/handgelenksstrecker_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/handgelenksstrecker_li.png")
    },
    {
        name: "WRIST_EXTENSOR_RIGHT",
        width: 0.06,
        height: 0.1,
        top: 0.35,
        right: 0.25,
        transform: [{ rotate: "-20deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/handgelenksstrecker_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/handgelenksstrecker_re.png")
    },
    {
        name: "FINGER_WRIST_MUSCLES_LEFT",
        width: 0.06,
        height: 0.04,
        top: 0.48,
        left: 0.15,
        transform: [{ rotate: "20deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/finger_handgelenksmuskulatur_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/finger_handgelenksmuskulatur_li.png")
    },
    {
        name: "FINGER_WRIST_MUSCLES_RIGHT",
        width: 0.06,
        height: 0.04,
        top: 0.49,
        right: 0.23,
        transform: [{ rotate: "-20deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_back/finger_handgelenksmuskulatur_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_back/finger_handgelenksmuskulatur_re.png")
    }
];
export { muscleMBack };
