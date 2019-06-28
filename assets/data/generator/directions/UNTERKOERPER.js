const UNTERKOERPER = {
    1: [{ direction: "KNEE", side: "BOTH" }],
    2: [{ direction: null, side: "ONE" }, { direction: null, side: "ONE" }],
    3: [
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" },
        { direction: "HIP", side: "BOTH" }
    ],
    4: [
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" }
    ],
    5: [
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" },
        { direction: "HIP", side: "BOTH" }
    ],
    6: [
        { direction: "HIP", side: "BOTH" },
        { direction: "KNEE", side: "BOTH" },
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" },
        { direction: null, side: "ONE" }
    ]
};

export default UNTERKOERPER;
