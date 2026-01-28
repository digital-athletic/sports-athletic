const SA = {
    default: {
        15: [
            { tags: ["REGION_UPPER_BODY", "REGION_LOWER_BODY"], count: 2 },
            { tags: ["SKILL_SAS"], count: 1 }
        ],
        20: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 }
        ],
        25: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["SKILL_SAS"], count: 2 }
        ],
        30: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["SKILL_SAS"], count: 2 }
        ],
        35: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["SKILL_SAS"], count: 1 }
        ]
    }
} as const;

export default SA;
