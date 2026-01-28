/**
 * choose 5 exercises to warm up for test exercise
 *
 * @type {{PROFESSIONAL: {default: number[]}, BEGINNER: {default: number[]}, ADVANCED: {default: number[], m: number[]}}}
 */
const TEST_WORKOUTS_WU_REGION = [
    { tags: ["LOWER_BODY"], count: 1 },
    { tags: ["FULL_BODY"], count: 1 },
    { tags: ["UPPER_BODY"], count: 1 },
    { tags: [], count: 2 }
] as const;
export default TEST_WORKOUTS_WU_REGION;
