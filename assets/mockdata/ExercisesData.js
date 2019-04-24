export const DEFAULT_EXERCISES_DATA = {
    999999: {
        exerciseId: 999999,
        level: 1,
        name: "Pause", // row 399
        description: "",
        picture: "999999Pause.png",
        startValue: 0, // value can be reps, weight, duration, ...
        targetValue: 0, // TODO check if we could have multiple targets
        //TODO remove?
        tags: ["PAUSE"]
    },
    0: {
        exerciseId: 0,
        level: 1,
        name: "seitlicher Ausfallschritt statisch", // row 399
        description: { default: ["Mach das richtig!"], en: ["Do it right!"] },
        picture: "0000seitlicher_Ausfallschritt_statisch_li_re_Warm_Up.png",
        video: "0000seitlicher_Ausfallschritt_statisch_li_re_Warm_Up.mp4",
        startValue: 20, // value can be reps, weight, duration, ...
        targetValue: 30, // TODO check if we could have multiple targets
        //TODO remove?
        tags: [
            "WARMUP",
            "PREVENTION",
            "LEVEL_BEGINNER",
            "MUSCLE_BRUST",
            "MUSCLE_NACKEN",
            "EQUIPMENT_BOX"
        ]
    },
    1: {
        exerciseId: 1,
        //TODO remove?
        level: 1,
        name: "gerade Sprünge",
        description: "",
        picture: "0001gerade_Sprnge_Level_1_Stabi.png",
        video: "0001gerade_Sprnge_Level_1_Stabi.mp4",
        startValue: 8, // value can be reps, weight, duration, ...
        targetValue: 14, // TODO check if we could have multiple targets
        //TODO remove?
        tags: ["MOBILITY", "LEVEL_BEGINNER"]
    },
    2: {
        exerciseId: 2,
        //TODO remove?
        level: 1,
        name: "Beinbeuger auf Handtuch",
        description: "",
        picture: "0002Beinbeuger_auf_Handtuch_Level_1_SWR.png",
        video: "0002Beinbeuger_auf_Handtuch_Level_1_SWR.mp4",
        startValue: 10, // value can be reps, weight, duration, ...
        targetValue: 18, // TODO check if we could have multiple targets
        //TODO remove?
        tags: ["SWR", "LEVEL_BEGINNER"]
    },
    3: {
        exerciseId: 3,
        //TODO remove?
        level: 1,
        name: "Military Press",
        description: "",
        picture: "0003Military_Press_Level_1_SWR.png",
        video: "0003Military_Press_Level_1_SWR.mp4",
        startValue: 10, // value can be reps, weight, duration, ...
        targetValue: 18, // TODO check if we could have multiple targets
        //TODO remove?
        tags: ["SWR", "LEVEL_BEGINNER"]
    },
    4: {
        exerciseId: 4,
        //TODO remove?
        level: 1,
        name: "Handtuch wischen",
        description: "",
        picture: "0004Handtuch_wischen_Level_1_SWR.png",
        video: "0004Handtuch_wischen_Level_1_SWR.mp4",
        startValue: 10, // value can be reps, weight, duration, ...
        targetValue: 18, // TODO check if we could have multiple targets
        //TODO remove?
        tags: ["STABILITY", "SWR", "LEVEL_BEGINNER"]
    },
    5: {
        exerciseId: 5,
        //TODO remove?
        level: 1,
        name: "Seitstütz Adduktoren links",
        description: "",
        picture: "0005Seitsttz_Adduktoren_Level_1_li_SWR.png",
        video: "0005Seitsttz_Adduktoren_Level_1_li_SWR.mp4",
        startValue: 10, // value can be reps, weight, duration, ...
        targetValue: 18, // TODO check if we could have multiple targets
        //TODO remove?
        tags: ["STABILITY", "SWR", "LEVEL_BEGINNER"]
    },
    6: {
        exerciseId: 6,
        //TODO remove?
        level: 1,
        name: "Seitstütz Adduktoren rechts",
        description: "",
        picture: "0006Seitsttz_Adduktoren_Level_1_re_SWR.png",
        video: "0006Seitsttz_Adduktoren_Level_1_re_SWR.mp4",
        startValue: 10, // value can be reps, weight, duration, ...
        targetValue: 18, // TODO check if we could have multiple targets
        //TODO remove?
        tags: ["STABILITY", "SWR", "LEVEL_BEGINNER"]
    }
};
