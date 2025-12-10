const CD = {
    default: {
        5: [
            { tags: ["REGION_OBERKOERPER"], count: 2 },
            { tags: ["REGION_UNTERKOERPER"], count: 4 }
        ],
        10: [
            { tags: ["REGION_OBERKOERPER"], count: 4 },
            { tags: ["REGION_UNTERKOERPER"], count: 6 }
        ]
    }
} as const;

export default CD;
