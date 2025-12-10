const GANZKOERPER = {
    1: [
        {
            direction: null,
            side: "BOTH"
        }
    ],
    2: [
        {
            direction: "HORIZONTAL_PUSH",
            side: "BOTH"
        },
        {
            direction: "HORIZONTAL_PULL",
            side: "BOTH"
        }
    ],
    3: [
        {
            direction: "HORIZONTAL_PUSH",
            side: "BOTH"
        },
        {
            direction: "HORIZONTAL_PULL",
            side: "BOTH"
        },
        { direction: null, side: "BOTH" }
    ],
    4: [
        {
            direction: "HORIZONTAL_PUSH",
            side: "BOTH"
        },
        {
            direction: "HORIZONTAL_PULL",
            side: "BOTH"
        },
        { direction: "HIP", side: "BOTH" },
        { direction: "KNEE", side: "BOTH" }
    ],
    5: [
        {
            direction: "HORIZONTAL_PUSH",
            side: "BOTH"
        },
        {
            direction: "HORIZONTAL_PULL",
            side: "BOTH"
        },
        { direction: "HIP", side: "BOTH" },
        { direction: "KNEE", side: "BOTH" },
        {
            direction: null,
            side: "BOTH"
        }
    ],
    6: [
        {
            direction: "HORIZONTAL_PUSH",
            side: "BOTH"
        },
        {
            direction: "HORIZONTAL_PULL",
            side: "BOTH"
        },
        { direction: "HIP", side: "BOTH" },
        { direction: "KNEE", side: "BOTH" },
        { direction: "VERTICAL_PUSH", side: "BOTH" },
        {
            direction: "VERTICAL_PULL",
            side: "BOTH"
        }
    ]
} as const;

export default GANZKOERPER;
