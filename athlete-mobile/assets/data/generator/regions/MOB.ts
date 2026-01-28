const MOB = {
    default: {
        5: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["REGION_FULL_BODY"], count: 1 }
        ],
        10: [
            { tags: ["REGION_UPPER_BODY"], count: 4 },
            { tags: ["REGION_LOWER_BODY"], count: 4 },
            { tags: ["REGION_FULL_BODY"], count: 2 }
        ]
    }
} as const;

export default MOB;
