const SAKG = {
    default: {
        15: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 }
        ],
        20: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["SKILL_SAS"], count: 1 }
        ],
        25: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["SKILL_SAS"], count: 1 }
        ],
        30: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            { tags: ["SKILL_SAS"], count: 3 }
        ],
        35: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            { tags: ["SKILL_SAS"], count: 3 }
        ]
    }
} as const;

export default SAKG;
