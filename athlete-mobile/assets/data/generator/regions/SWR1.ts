// TODO Unterscheidung Anf/Fortg und Profis (weniger Übungen, da mehr Sätze)
const SWR1 = {
    default: {
        20: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 }
        ],
        25: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["REGION_CORE"], count: 2 }
        ],
        30: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["REGION_CORE"], count: 3 }
        ],
        35: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["REGION_CORE"], count: 2 }
        ],
        40: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["REGION_CORE"], count: 3 }
        ],
        45: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["REGION_CORE"], count: 4 }
        ],
        50: [
            { tags: ["REGION_UPPER_BODY"], count: 4 },
            { tags: ["REGION_LOWER_BODY"], count: 4 },
            { tags: ["REGION_CORE"], count: 3 }
        ],
        55: [
            { tags: ["REGION_UPPER_BODY"], count: 4 },
            { tags: ["REGION_LOWER_BODY"], count: 4 },
            { tags: ["REGION_CORE"], count: 4 }
        ]
    }
} as const;

export default SWR1;
