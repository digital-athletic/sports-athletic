import {
  getDefaultPositionForSport,
  getPositionsForSport,
  shouldShowPositionQuestion,
} from "./sportPositions";

describe("getPositionsForSport", () => {
  it("returns handball positions", () => {
    const positions = getPositionsForSport("SPORT_HANDBALL");
    expect(positions?.map((p) => p.value)).toEqual([
      "BACKCOURT",
      "WING",
      "PIVOT",
      "GOALKEEPER",
      "REFEREE",
    ]);
  });

  it("returns football positions", () => {
    const positions = getPositionsForSport("SPORT_FOOTBALL");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD", "GOAL"]);
  });

  it("returns only FIELD for volleyball", () => {
    const positions = getPositionsForSport("SPORT_VOLLEYBALL");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD"]);
  });

  it("returns only FIELD for basketball", () => {
    const positions = getPositionsForSport("SPORT_BASKETBALL");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD"]);
  });

  it("returns ice hockey positions", () => {
    const positions = getPositionsForSport("SPORT_ICE_HOCKEY");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD", "GOAL"]);
  });

  it("returns hockey positions", () => {
    const positions = getPositionsForSport("SPORT_HOCKEY");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD", "GOAL"]);
  });

  it("returns only FIELD for american football", () => {
    const positions = getPositionsForSport("SPORT_AMERICAN_FOOTBALL");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD"]);
  });

  it("returns only FIELD for rugby", () => {
    const positions = getPositionsForSport("SPORT_RUGBY");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD"]);
  });

  it("returns null for SPORT_OTHER", () => {
    expect(getPositionsForSport("SPORT_OTHER")).toBeNull();
  });
});

describe("shouldShowPositionQuestion", () => {
  it("returns false for SPORT_OTHER", () => {
    expect(shouldShowPositionQuestion("SPORT_OTHER")).toBe(false);
  });

  it("returns true for SPORT_HANDBALL", () => {
    expect(shouldShowPositionQuestion("SPORT_HANDBALL")).toBe(true);
  });

  it("returns true for SPORT_VOLLEYBALL (single position, still shown)", () => {
    expect(shouldShowPositionQuestion("SPORT_VOLLEYBALL")).toBe(true);
  });
});

describe("getDefaultPositionForSport", () => {
  it("returns OTHER for SPORT_OTHER", () => {
    expect(getDefaultPositionForSport("SPORT_OTHER")).toEqual(["OTHER"]);
  });

  it("returns first position for single-position sports", () => {
    expect(getDefaultPositionForSport("SPORT_VOLLEYBALL")).toEqual(["FIELD"]);
    expect(getDefaultPositionForSport("SPORT_BASKETBALL")).toEqual(["FIELD"]);
  });

  it("returns empty array for multi-position sports", () => {
    expect(getDefaultPositionForSport("SPORT_HANDBALL")).toEqual([]);
    expect(getDefaultPositionForSport("SPORT_FOOTBALL")).toEqual([]);
  });
});
