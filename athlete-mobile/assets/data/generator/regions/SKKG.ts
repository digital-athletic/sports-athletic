const SKKG = {
    default: {
        15: [
            { tags: ["REGION_UPPER_BODY"], count: 1 },
            { tags: ["REGION_LOWER_BODY"], count: 1 },
            {
                tags: ["SKILL_PLYO_HIGH", "SKILL_PLYO_MEDIUM"],
                count: 2
            }
        ],
        20: [
            { tags: ["REGION_UPPER_BODY"], count: 2 },
            { tags: ["REGION_LOWER_BODY"], count: 2 },
            {
                tags: ["SKILL_PLYO_HIGH", "SKILL_PLYO_MEDIUM"],
                count: 2
            }
        ],
        25: [
            { tags: ["REGION_UPPER_BODY"], count: 3 },
            { tags: ["REGION_LOWER_BODY"], count: 3 },
            {
                tags: ["SKILL_PLYO_HIGH", "SKILL_PLYO_MEDIUM"],
                count: 2
            }
        ],
        30: [
            { tags: ["REGION_UPPER_BODY"], count: 4 },
            { tags: ["REGION_LOWER_BODY"], count: 4 },
            { tags: ["SKILL_PLYO_MEDIUM"], count: 2 }
        ],
        35: [
            { tags: ["REGION_UPPER_BODY"], count: 5 },
            { tags: ["REGION_LOWER_BODY"], count: 5 },
            {
                tags: ["SKILL_PLYO_MEDIUM", "SKILL_PLYO_HIGH"],
                count: 1
            }
        ]
    }
} as const;

export default SKKG;
