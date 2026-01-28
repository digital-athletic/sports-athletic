const WU = {
    default: {
        5: [
            { tags: ["REGION_UPPER_BODY"], count: 1 },
            { tags: ["REGION_LOWER_BODY"], count: 3 }
        ],
        10: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 5 },
            { tags: ["REGION_FULL_BODY"], count: 1 }
        ]
    }
} as const;

export default WU;
