import {
  getExerciseById,
  getExercisesByTag,
  getAllExercises,
  getExerciseRegistry,
  clearExerciseRegistry,
} from "./exerciseRegistry";

describe("exerciseRegistry", () => {
  beforeEach(() => {
    clearExerciseRegistry();
  });

  describe("singleton behavior", () => {
    it("returns the same array reference on multiple calls", () => {
      expect(getAllExercises()).toBe(getAllExercises());
    });

    it("returns the same Map reference on multiple calls", () => {
      expect(getExerciseRegistry()).toBe(getExerciseRegistry());
    });
  });

  describe("getAllExercises", () => {
    it("returns the full exercise dataset", () => {
      const exercises = getAllExercises();
      // Dataset contains 1206 exercises
      expect(exercises.length).toBe(1206);
    });
  });

  describe("tags", () => {
    it("holds no exercise with a doubled muscle prefix", () => {
      const malformed = getAllExercises()
        .filter((exercise) =>
          exercise.tags.some((tag) => tag.startsWith("MUSCLE_MUSCLE_")),
        )
        .map((exercise) => exercise.id);
      expect(malformed).toEqual([]);
    });

    it("blocks knee, ankle, hip and spine on every high intensity plyometric exercise", () => {
      const required = [
        "BLOCK_KNEE",
        "BLOCK_ANKLE",
        "BLOCK_HIP",
        "BLOCK_SPINE",
      ];
      const unblocked = getAllExercises()
        .filter((exercise) => exercise.tags.includes("SKILL_PLYO_HIGH"))
        .filter((exercise) =>
          required.some((tag) => !exercise.tags.includes(tag)),
        )
        .map((exercise) => exercise.id);
      expect(unblocked).toEqual([]);
    });
  });

  describe("getExerciseById", () => {
    it("returns the Pause exercise for id 999999", () => {
      const pause = getExerciseById("999999");

      expect(pause).toEqual(
        expect.objectContaining({
          id: "999999",
          name: "Pause",
          displayName: "Pause",
          tags: ["PAUSE"],
          level: { m: 1, w: 1 },
        }),
      );
    });

    it("returns the exact same object reference as in getAllExercises", () => {
      const exercises = getAllExercises();
      const target = exercises.find((e) => e.id === "1")!;

      expect(getExerciseById("1")).toBe(target);
    });

    it("returns undefined for non-existent id", () => {
      expect(getExerciseById("id-that-does-not-exist")).toBeUndefined();
    });
  });

  describe("getExercisesByTag", () => {
    it("returns exactly 1 exercise for PAUSE tag", () => {
      const pauseExercises = getExercisesByTag("PAUSE");

      expect(pauseExercises).toHaveLength(1);
      expect(pauseExercises[0].id).toBe("999999");
    });

    it("returns 414 exercises for MUSCLE_QUADRICEPS tag", () => {
      const quadExercises = getExercisesByTag("MUSCLE_QUADRICEPS");

      expect(quadExercises).toHaveLength(414);
      expect(
        quadExercises.every((e) => e.tags.includes("MUSCLE_QUADRICEPS")),
      ).toBe(true);
    });

    it("returns empty array for non-existent tag", () => {
      expect(getExercisesByTag("TAG_THAT_DOES_NOT_EXIST")).toEqual([]);
    });
  });

  describe("getExerciseRegistry", () => {
    it("contains all 1206 exercises keyed by id", () => {
      const registry = getExerciseRegistry();

      expect(registry.size).toBe(1206);
      expect(registry.get("999999")?.name).toBe("Pause");
      expect(registry.get("1")?.tags).toContain("EQ_DUMBBELL");
    });
  });

  describe("clearExerciseRegistry", () => {
    it("creates a new array instance after clearing", () => {
      const before = getAllExercises();
      clearExerciseRegistry();

      expect(getAllExercises()).not.toBe(before);
    });
  });
});
