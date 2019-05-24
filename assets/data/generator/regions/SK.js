const SK = {
    default: {
        15: [
            { tags: ["REGION_OBERKOERPER"], count: 2 },
            { tags: ["REGION_UNTERKOERPER"], count: 2 }
        ],
        20: [
            { tags: ["REGION_OBERKOERPER"], count: 2 },
            { tags: ["REGION_UNTERKOERPER"], count: 2 },
            {
                tags: ["EXERCISENAME_PLYO_HIGH", "EXERCISENAME_PLYO_MEDIUM"],
                count: 1
            }
        ],
        25: [
            { tags: ["REGION_OBERKOERPER"], count: 2 },
            { tags: ["REGION_UNTERKOERPER"], count: 2 },
            {
                tags: ["EXERCISENAME_PLYO_HIGH", "EXERCISENAME_PLYO_MEDIUM"],
                count: 2
            }
        ],
        30: [
            { tags: ["REGION_OBERKOERPER"], count: 3 },
            { tags: ["REGION_UNTERKOERPER"], count: 3 },
            { tags: ["EXERCISENAME_PLYO_MEDIUM"], count: 2 }
        ],
        35: [
            { tags: ["REGION_OBERKOERPER"], count: 3 },
            { tags: ["REGION_UNTERKOERPER"], count: 3 },
            { tags: ["EXERCISENAME_PLYO_HIGH"], count: 2 }
        ]
    }
};

export default SK;
