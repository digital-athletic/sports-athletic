const WU = {
    default: {
        5: [
            { tags: ["REGION_OBERKOERPER"], count: 1 },
            { tags: ["REGION_UNTERKOERPER"], count: 3 }
        ],
        10: [
            { tags: ["REGION_OBERKOERPER"], count: 2 },
            { tags: ["REGION_UNTERKOERPER"], count: 5 },
            { tags: ["REGION_GANZKOERPER"], count: 1 }
        ]
    }
} as const;

export default WU;
