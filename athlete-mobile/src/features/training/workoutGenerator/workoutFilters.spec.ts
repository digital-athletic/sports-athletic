import { resolveWorkoutFilters } from "./workoutFilters";

describe("workoutFilters: resolveWorkoutFilters", () => {
  it("applies every filter when no filter is given", () => {
    expect(resolveWorkoutFilters()).toEqual({
      soreness: true,
      pain: true,
      equipment: true,
    });
  });

  it("switches off only the filters set to false", () => {
    expect(resolveWorkoutFilters({ pain: false, equipment: false })).toEqual({
      soreness: true,
      pain: false,
      equipment: false,
    });
  });

  it("keeps a filter set to true", () => {
    expect(resolveWorkoutFilters({ soreness: true })).toEqual({
      soreness: true,
      pain: true,
      equipment: true,
    });
  });

  it("returns a frozen object", () => {
    expect(Object.isFrozen(resolveWorkoutFilters({ soreness: false }))).toBe(
      true,
    );
  });
});
