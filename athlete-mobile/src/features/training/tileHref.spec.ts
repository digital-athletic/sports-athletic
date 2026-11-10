import { PREVENTION_TILES } from "@/constants/workoutConstants";
import { tileHref } from "./tileHref";

describe("tileHref: route of a training tile", () => {
  it("returns the route and the parameters of the tile", () => {
    const ankleTile = PREVENTION_TILES[0];

    expect(tileHref(ankleTile)).toEqual({
      pathname: "/training/muscle-soreness",
      params: { type: "PREVANKLE" },
    });
  });
});
