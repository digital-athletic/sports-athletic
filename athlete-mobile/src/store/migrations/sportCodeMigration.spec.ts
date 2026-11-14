import { migrateSportCode } from "./sportCodeMigration";

describe("migrateSportCode: stored sport of an athlete", () => {
  it.each([
    ["HANDBALL_SPORT", "SPORT_HANDBALL"],
    ["FOOTBALL_SPORT", "SPORT_FOOTBALL"],
    ["VOLLEYBALL_SPORT", "SPORT_VOLLEYBALL"],
    ["BASKETBALL_SPORT", "SPORT_BASKETBALL"],
    ["ICE_HOCKEY_SPORT", "SPORT_ICE_HOCKEY"],
    ["HOCKEY_SPORT", "SPORT_HOCKEY"],
    ["AMERICAN_FOOTBALL_SPORT", "SPORT_AMERICAN_FOOTBALL"],
    ["RUGBY_SPORT", "SPORT_RUGBY"],
    ["OTHER_SPORT", "SPORT_OTHER"],
  ])("renames %s to %s", (storedCode, renamedCode) => {
    expect(migrateSportCode(storedCode)).toBe(renamedCode);
  });

  it("leaves a renamed code unchanged", () => {
    expect(migrateSportCode("SPORT_HANDBALL")).toBe("SPORT_HANDBALL");
  });

  it("falls back to the general sport for an unknown code", () => {
    expect(migrateSportCode("FAKE_UNKNOWN")).toBe("SPORT_OTHER");
  });

  it("falls back to the general sport when no sport is stored", () => {
    expect(migrateSportCode(undefined)).toBe("SPORT_OTHER");
  });
});
