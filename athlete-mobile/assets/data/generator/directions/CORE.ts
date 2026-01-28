const CORE = {
    1: [
        {
            direction: "SIDE",
            side: "BOTH"
        }
    ],
    2: [
        {
            direction: "BACK",
            side: "BOTH"
        },
        {
            direction: "FRONT",
            side: "BOTH"
        }
    ],
    3: [
        {
            direction: "SIDE",
            side: "BOTH"
        },
        {
            direction: "BACK",
            side: "BOTH"
        },
        {
            direction: "FRONT",
            side: "BOTH"
        }
    ],
    4: [
        {
            direction: "SIDE",
            side: "BOTH"
        },
        {
            direction: "BACK",
            side: "BOTH"
        },
        {
            direction: "FRONT",
            side: "BOTH"
        },
        {
            direction: "ROTATION",
            side: "BOTH"
        }
    ],
    5: [
        {
            direction: "SIDE",
            side: "BOTH"
        },
        {
            direction: "BACK",
            side: "BOTH"
        },
        {
            direction: "FRONT",
            side: "BOTH"
        },
        {
            direction: "ROTATION",
            side: "BOTH"
        },
        {
            direction: null,
            side: "BOTH"
        }
    ],
    6: [
        {
            direction: "SIDE",
            side: "BOTH"
        },
        {
            direction: "BACK",
            side: "BOTH"
        },
        {
            direction: "FRONT",
            side: "BOTH"
        },
        {
            direction: "ROTATION",
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

export default CORE;
