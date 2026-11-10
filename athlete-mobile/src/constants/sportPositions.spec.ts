import {
  getDefaultPositionForSport,
  getPositionsForSport,
  shouldShowPositionQuestion,
} from "./sportPositions";

describe("getPositionsForSport", () => {
  it("returns handball positions", () => {
    const positions = getPositionsForSport("HANDBALL_SPORT");
    expect(positions?.map((p) => p.value)).toEqual([
      "BACKCOURT",
      "WING",
      "PIVOT",
      "GOALKEEPER",
      "REFEREE",
    ]);
  });

  it("returns football positions", () => {
    const positions = getPositionsForSport("FOOTBALL_SPORT");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD", "GOAL"]);
  });

  it("returns only FIELD for volleyball", () => {
    const positions = getPositionsForSport("VOLLEYBALL_SPORT");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD"]);
  });

  it("returns only FIELD for basketball", () => {
    const positions = getPositionsForSport("BASKETBALL_SPORT");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD"]);
  });

  it("returns ice hockey positions", () => {
    const positions = getPositionsForSport("ICE_HOCKEY_SPORT");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD", "GOAL"]);
  });

  it("returns hockey positions", () => {
    const positions = getPositionsForSport("HOCKEY_SPORT");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD", "GOAL"]);
  });

  it("returns only FIELD for american football", () => {
    const positions = getPositionsForSport("AMERICAN_FOOTBALL_SPORT");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD"]);
  });

  it("returns only FIELD for rugby", () => {
    const positions = getPositionsForSport("RUGBY_SPORT");
    expect(positions?.map((p) => p.value)).toEqual(["FIELD"]);
  });

  it("returns null for OTHER_SPORT", () => {
    expect(getPositionsForSport("OTHER_SPORT")).toBeNull();
  });
});

describe("shouldShowPositionQuestion", () => {
  it("returns false for OTHER_SPORT", () => {
    expect(shouldShowPositionQuestion("OTHER_SPORT")).toBe(false);
  });

  it("returns true for HANDBALL_SPORT", () => {
    expect(shouldShowPositionQuestion("HANDBALL_SPORT")).toBe(true);
  });

  it("returns true for VOLLEYBALL_SPORT (single position, still shown)", () => {
    expect(shouldShowPositionQuestion("VOLLEYBALL_SPORT")).toBe(true);
  });
});

describe("getDefaultPositionForSport", () => {
  it("returns OTHER for OTHER_SPORT", () => {
    expect(getDefaultPositionForSport("OTHER_SPORT")).toEqual(["OTHER"]);
  });

  it("returns first position for single-position sports", () => {
    expect(getDefaultPositionForSport("VOLLEYBALL_SPORT")).toEqual(["FIELD"]);
    expect(getDefaultPositionForSport("BASKETBALL_SPORT")).toEqual(["FIELD"]);
  });

  it("returns empty array for multi-position sports", () => {
    expect(getDefaultPositionForSport("HANDBALL_SPORT")).toEqual([]);
    expect(getDefaultPositionForSport("FOOTBALL_SPORT")).toEqual([]);
  });
});
