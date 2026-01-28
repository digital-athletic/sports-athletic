const kineticMuscles = [
    {
        name: "SHIN_LEFT",
        width: 0.1,
        height: 0.2,
        top: 0.7,
        right: 0.35,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/schienbein_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/schienbein_li.png")
    },
    {
        name: "CALVES",
        width: 0.08,
        height: 0.18,
        top: 0.7,
        left: 0.41,
        transform: [{ rotate: "18deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/waden.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/waden.png")
    },
    {
        name: "QUADRICEPS_RIGHT",
        width: 0.06,
        height: 0.19,
        top: 0.475,
        left: 0.41,
        transform: [{ rotate: "10deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/oberschenkelvorderseite_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/oberschenkelvorderseite_re.png")
    },
    {
        name: "ADDUCTORS",
        width: 0.045,
        height: 0.14,
        top: 0.5,
        right: 0.47,
        transform: [{ rotate: "6deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/innereOberschenkelmuskulatur.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/innereOberschenkelmuskulatur.png")
    },
    {
        name: "QUADRICEPS_LEFT",
        width: 0.06,
        height: 0.19,
        top: 0.5,
        right: 0.37,
        transform: [{ rotate: "-8deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/oberschenkelvorderseite_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/oberschenkelvorderseite_li.png")
    },
    {
        name: "ABDUCTORS",
        width: 0.06,
        height: 0.18,
        top: 0.458,
        right: 0.317,
        transform: [{ rotate: "-8deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/aeussereOberschenkelmuskulatur.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/aeussereOberschenkelmuskulatur.png")
    },
    {
        name: "RECTUS_ABDOMINIS",
        width: 0.08,
        height: 0.17,
        top: 0.33,
        left: 0.513,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/geradeBauchmuskeln.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/geradeBauchmuskeln.png")
    },
    {
        name: "OBLIQUES",
        width: 0.045,
        height: 0.12,
        top: 0.339,
        right: 0.352,
        backgroundColor: "rgba(0,0,0,0)",
        transform: [{ rotate: "10deg" }],
        image: require("../../img/bodyparts/muscle_w_front/seitlicheBauchmuskeln.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/seitlicheBauchmuskeln.png")
    },
    {
        name: "OBLIQUES",
        width: 0.041,
        height: 0.143,
        top: 0.332,
        left: 0.461,
        transform: [{ rotate: "-3deg" }],
        backgroundColor: "rgba(0,0,0,0)"
    },
    {
        name: "CHEST",
        width: 0.16,
        height: 0.08,
        top: 0.24,
        right: 0.35,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/brust.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/brust.png")
    },
    {
        name: "NECK",
        width: 0.1,
        height: 0.07,
        top: 0.16,
        left: 0.534,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/nacken.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/nacken.png")
    },
    {
        name: "SHOULDER_RIGHT",
        width: 0.05,
        height: 0.07,
        top: 0.19,
        left: 0.445,
        transform: [{ rotate: "53deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/schulter_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/schulter_re.png")
    },
    {
        name: "SHOULDER_LEFT",
        width: 0.05,
        height: 0.07,
        top: 0.21,
        right: 0.275,
        transform: [{ rotate: "-53deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/schulter_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/schulter_li.png")
    },
    {
        name: "BICEPS_RIGHT",
        width: 0.05,
        height: 0.07,
        top: 0.277,
        left: 0.412,
        transform: [{ rotate: "20deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/bizeps_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/bizeps_re.png")
    },
    {
        name: "BICEPS_LEFT",
        width: 0.07,
        height: 0.09,
        top: 0.277,
        right: 0.26,
        transform: [{ rotate: "-5deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/bizeps_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/bizeps_li.png")
    },
    {
        name: "WRIST_FLEXOR_RIGHT",
        width: 0.04,
        height: 0.09,
        top: 0.357,
        left: 0.371,
        transform: [{ rotate: "20deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/handgelenksbeuger_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/handgelenksbeuger_re.png")
    },
    {
        name: "WRIST_FLEXOR_LEFT",
        width: 0.05,
        height: 0.09,
        top: 0.38,
        right: 0.248,
        transform: [{ rotate: "-10deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/handgelenksbeuger_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/handgelenksbeuger_li.png")
    },
    {
        name: "FINGER_WRIST_MUSCLES_RIGHT",
        width: 0.04,
        height: 0.04,
        top: 0.462,
        left: 0.305,
        transform: [{ rotate: "25deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/fingerHandgelenksmuskulatur_re.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/fingerHandgelenksmuskulatur_re.png")
    },
    {
        name: "FINGER_WRIST_MUSCLES_LEFT",
        width: 0.06,
        height: 0.04,
        top: 0.48,
        right: 0.2,
        transform: [{ rotate: "-25deg" }],
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_w_front/fingerHandgelenksmuskulatur_li.png"),
        secondaryImage: require("../../img/bodyparts/muscle_w_front/fingerHandgelenksmuskulatur_li.png")
    }
];

const muscleWFrontSoreness = kineticMuscles;
const muscleWFront = [
    {
        name: "CARDIO",
        width: 0.15,
        height: 0.08,
        top: 0.21,
        right: 0.1,
        backgroundColor: "rgba(0,0,0,0)",
        image: require("../../img/bodyparts/muscle_m_front/herz.png"),
        secondaryImage: require("../../img/bodyparts/muscle_m_front/herz.png")
    }
].concat(kineticMuscles);

export { muscleWFront, muscleWFrontSoreness };
