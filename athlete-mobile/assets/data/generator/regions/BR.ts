const BR = {
    default: {
        5: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 }
        ],
        10: [
            { tags: ["REGION_UPPER_BODY"], count: 4 },
            { tags: ["REGION_LOWER_BODY"], count: 4 }
        ]
    }
} as const;

export default BR;
