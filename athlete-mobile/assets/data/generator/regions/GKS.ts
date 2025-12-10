const GKS = {
    default: {
        5: [{ tags: ["REGION_GANZKOERPER"], count: 2 }],
        10: [
            { tags: ["REGION_GANZKOERPER"], count: 2 },
            { tags: ["REGION_OBERKOERPER"], count: 1 }
        ],
        15: [
            { tags: ["REGION_GANZKOERPER"], count: 3 },
            { tags: ["REGION_OBERKOERPER"], count: 2 }
        ],
        20: [
            { tags: ["REGION_GANZKOERPER"], count: 4 },
            { tags: ["REGION_OBERKOERPER"], count: 2 }
        ],
        25: [
            { tags: ["REGION_GANZKOERPER"], count: 5 },
            { tags: ["REGION_OBERKOERPER"], count: 3 }
        ],
        30: [
            { tags: ["REGION_GANZKOERPER"], count: 6 },
            { tags: ["REGION_OBERKOERPER"], count: 3 }
        ],
        35: [
            { tags: ["REGION_GANZKOERPER"], count: 7 },
            { tags: ["REGION_OBERKOERPER"], count: 4 }
        ],
        40: [
            { tags: ["REGION_GANZKOERPER"], count: 8 },
            { tags: ["REGION_OBERKOERPER"], count: 4 }
        ]
    }
} as const;

export default GKS;
