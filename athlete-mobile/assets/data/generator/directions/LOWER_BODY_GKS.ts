const LOWER_BODY_GKS = {
    1: [{ exercise_direction: "KNEE", side: "BOTH" }],
    2: [
        { exercise_direction: "KNEE", side: "BOTH" },
        { exercise_direction: "HIP", side: "BOTH" }
    ],
    3: [
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: "KNEE", side: "BOTH" }
    ],
    4: [
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: "KNEE", side: "BOTH" },
        { exercise_direction: "HIP", side: "BOTH" }
    ],
    5: [
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: "KNEE", side: "BOTH" }
    ],
    6: [
        { exercise_direction: "HIP", side: "BOTH" },
        { exercise_direction: "KNEE", side: "BOTH" },
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: null, side: "ONE" },
        { exercise_direction: null, side: "ONE" }
    ]
} as const;

export default LOWER_BODY_GKS;
