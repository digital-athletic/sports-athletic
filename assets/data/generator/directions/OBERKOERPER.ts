const OBERKOERPER = {
    1: [
        {
            direction: "HORIZONTAL_PUSH",
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
        { direction: "VERTICAL_PUSH", side: "BOTH" }
    ],
    4: [
        { direction: "VERTICAL_PUSH", side: "BOTH" },
        {
            direction: "VERTICAL_PULL",
            side: "BOTH"
        },
        {
            direction: "HORIZONTAL_PUSH",
            side: "BOTH"
        },
        {
            direction: "HORIZONTAL_PULL",
            side: "BOTH"
        }
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
        { direction: "VERTICAL_PUSH", side: "BOTH" },
        {
            direction: "VERTICAL_PULL",
            side: "BOTH"
        },
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
        { direction: "VERTICAL_PUSH", side: "BOTH" },
        {
            direction: "VERTICAL_PULL",
            side: "BOTH"
        },
        {
            direction: null,
            side: "ONE"
        },
        {
            direction: null,
            side: "ONE"
        }
    ]
} as const;

export default OBERKOERPER;
