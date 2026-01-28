const SWR1KG = {
    default: {
        15: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["REGION_CORE"], count: 2 }
        ],
        20: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["REGION_CORE"], count: 2 }
        ],
        25: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["REGION_CORE"], count: 3 }
        ],
        30: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["REGION_CORE"], count: 4 }
        ],
        35: [
            { tags: ["REGION_UPPER_BODY"], count: 4 },
            { tags: ["REGION_LOWER_BODY"], count: 4 },
            { tags: ["REGION_CORE"], count: 4 }
        ]
    },
    child: {
        10: [
            { tags: ["REGION_UPPER_BODY"], count: 1 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["REGION_CORE"], count: 1 }
        ],
        15: [
            { tags: ["REGION_UPPER_BODY"], count: 1 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["REGION_CORE"], count: 3 }
        ],
        20: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["REGION_CORE"], count: 3 }
        ],
        25: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["REGION_CORE"], count: 4 }
        ],
        30: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["REGION_CORE"], count: 4 }
        ],
        35: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 4 },
            { tags: ["REGION_CORE"], count: 5 }
        ]
    }
} as const;

export default SWR1KG;
