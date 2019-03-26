const muscleWBack = [
    {
        name: "WADE_RECHTS",
        width: 0.1,
        height: 0.18,
        top: 0.74,
        right: 0.37,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/wade_re.png")
    },
    {
        name: "WADE_LINKS",
        width: 0.1,
        height: 0.18,
        top: 0.73,
        left: 0.38,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/wade_li.png")
    },
    {
        name: "OBERSCHENKEL_HINTEN_RECHTS",
        width: 0.07,
        height: 0.15,
        top: 0.59,
        right: 0.42,
        transform: [{ rotate: "-14deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/oberschenkel_re.png")
    },
    {
        name: "OBERSCHENKEL_HINTEN_LINKS",
        width: 0.07,
        height: 0.15,
        top: 0.58,
        left: 0.36,
        transform: [{ rotate: "-8deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/oberschenkel_li.png")
    },
    {
        name: "INNERE_OBERSCHENKELMUSKULATUR",
        width: 0.04,
        height: 0.13,
        top: 0.58,
        left: 0.44,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/innereOberschenkelmuskulatur.png")
    },
    {
        name: "AEUSSERE_OBERSCHENKELMUSKULATUR",
        width: 0.04,
        height: 0.135,
        top: 0.53,
        right: 0.387,
        transform: [{ rotate: "-6deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/aeussereOberschenkelmuskulatur.png")
    },
    {
        name: "GESAESS",
        width: 0.2,
        height: 0.09,
        top: 0.48,
        right: 0.44,
        transform: [{ rotate: "6deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/gesaess.png")
    },
    {
        name: "UNTERER_RUECKEN",
        width: 0.19,
        height: 0.04,
        top: 0.39,
        right: 0.435,
        transform: [{ rotate: "90deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/untererRuecken.png")
    },
    {
        name: "GROSSER_RUECKENMUSKEL_LAT_LINKS",
        width: 0.06,
        height: 0.09,
        top: 0.32,
        left: 0.36,
        transform: [{ rotate: "-10deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/grosserRueckenmuskel_lat.png")
    },
    {
        name: "GROSSER_RUECKENMUSKEL_LAT_RECHTS",
        width: 0.05,
        height: 0.08,
        top: 0.312,
        right: 0.433,
        transform: [{ rotate: "15deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/grosserRueckenmuskel_lat.png")
    },
    {
        name: "OBERER_RUECKEN",
        width: 0.19,
        height: 0.055,
        top: 0.25,
        left: 0.365,
        transform: [{ rotate: "-5deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/obererRuecken.png")
    },
    {
        name: "NACKEN",
        width: 0.13,
        height: 0.04,
        top: 0.19,
        left: 0.384,
        transform: [{ rotate: "-5deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/nacken.png")
    },
    {
        name: "SCHULTER_LINKS",
        width: 0.09,
        height: 0.03,
        top: 0.265,
        left: 0.27,
        transform: [{ rotate: "-47deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/schulter_li.png")
    },
    {
        name: "SCHULTER_RECHTS",
        width: 0.09,
        height: 0.03,
        top: 0.235,
        right: 0.36,
        transform: [{ rotate: "47deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/schulter_re.png")
    },
    {
        name: "ARMSTRECKER_LINKS",
        width: 0.06,
        height: 0.09,
        top: 0.32,
        left: 0.28,
        transform: [{ rotate: "7deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/armstrecker_li.png")
    },
    {
        name: "ARMSTRECKER_RECHTS",
        width: 0.06,
        height: 0.09,
        top: 0.28,
        right: 0.35,
        transform: [{ rotate: "-10deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/armstrecker_re.png")
    },
    {
        name: "HANDGELENKSSTRECKER_LINKS",
        width: 0.05,
        height: 0.1,
        top: 0.42,
        left: 0.26,
        transform: [{ rotate: "16deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/handgelenksstrecker_li.png")
    },
    {
        name: "HANDGELENKSSTRECKER_RECHTS",
        width: 0.05,
        height: 0.09,
        top: 0.383,
        right: 0.31,
        transform: [{ rotate: "-24deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/handgelenksstrecker_re.png")
    },
    {
        name: "FINGER_HANDGELENKSMUSKULATUR_LINKS",
        width: 0.05,
        height: 0.04,
        top: 0.525,
        left: 0.225,
        transform: [{ rotate: "20deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/finger_handgelenksmuskulatur_li.png")
    },
    {
        name: "FINGER_HANDGELENKSMUSKULATUR_RECHTS",
        width: 0.05,
        height: 0.04,
        top: 0.485,
        right: 0.24,
        transform: [{ rotate: "-30deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_back/finger_handgelenksmuskulatur_re.png")
    }
];
export { muscleWBack };
