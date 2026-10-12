import { SharedConstants } from "@/constants/sharedConstants";
import { dropExpiredMarks, updateSorenessMarks } from "./sorenessMarks";

const DAY = SharedConstants.TIME_IN_MS.DAY;
const now = new Date(2026, 9, 12, 12).getTime();
const iso = (time: number) => new Date(time).toISOString();

const chestMarkedYesterday = {
  tag: "CHEST",
  date: iso(now - DAY / 2),
  expiration: iso(now + DAY / 2),
};

describe("updateSorenessMarks", () => {
  it("keeps the timestamps of a mark that stays", () => {
    const result = updateSorenessMarks(
      [chestMarkedYesterday],
      ["CHEST", "GLUTES"],
      now,
    );
    expect(result.find((mark) => mark.tag === "CHEST")).toEqual(
      chestMarkedYesterday,
    );
  });

  it("stamps a new mark with now and an expiration 24 hours later", () => {
    const result = updateSorenessMarks(
      [chestMarkedYesterday],
      ["CHEST", "GLUTES"],
      now,
    );
    expect(result.find((mark) => mark.tag === "GLUTES")).toEqual({
      tag: "GLUTES",
      date: iso(now),
      expiration: iso(now + DAY),
    });
  });

  it("drops a mark the athlete removed", () => {
    const result = updateSorenessMarks([chestMarkedYesterday], [], now);
    expect(result).toEqual([]);
  });
});

describe("dropExpiredMarks", () => {
  it("drops a mark whose expiration has passed", () => {
    const expired = {
      tag: "GLUTES",
      date: iso(now - 2 * DAY),
      expiration: iso(now - DAY),
    };
    expect(dropExpiredMarks([chestMarkedYesterday, expired], now)).toEqual([
      chestMarkedYesterday,
    ]);
  });
});
