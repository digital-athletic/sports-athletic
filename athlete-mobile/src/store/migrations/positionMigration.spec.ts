import { migratePositionTags } from "./positionMigration";

describe("migratePositionTags", () => {
  it("renames German handball positions to English", () => {
    const tags = { POSITION: ["RUECKRAUM", "AUSSEN"], LEVEL: ["BEGINNER"] };
    expect(migratePositionTags(tags)).toEqual({
      POSITION: ["BACKCOURT", "WING"],
      LEVEL: ["BEGINNER"],
    });
  });

  it("renames all five handball positions", () => {
    const tags = {
      POSITION: ["RUECKRAUM", "AUSSEN", "KREIS", "TOR", "SCHIRI"],
    };
    expect(migratePositionTags(tags)).toEqual({
      POSITION: ["BACKCOURT", "WING", "PIVOT", "GOALKEEPER", "REFEREE"],
    });
  });

  it("leaves already-English positions unchanged", () => {
    const tags = { POSITION: ["FIELD", "GOAL"] };
    expect(migratePositionTags(tags)).toEqual({ POSITION: ["FIELD", "GOAL"] });
  });

  it("handles undefined tags", () => {
    expect(migratePositionTags(undefined)).toEqual({});
  });

  it("handles tags without POSITION key", () => {
    const tags = { LEVEL: ["ADVANCED"] };
    expect(migratePositionTags(tags)).toEqual({ LEVEL: ["ADVANCED"] });
  });
});
