import {
  BACK_REGION_IDS,
  FRONT_REGION_IDS,
} from "@/bodyParts/silhouette/regionMapping";
import { PREVENTION_TILES } from "./workoutConstants";

describe("workoutConstants: prevention tile silhouettes", () => {
  it("gives every prevention tile a silhouette payload", () => {
    expect(PREVENTION_TILES.every((tile) => tile.silhouette)).toBe(true);
  });

  it("keeps each tile's regions and centerY renderable for its side", () => {
    for (const tile of PREVENTION_TILES) {
      const silhouette = tile.silhouette;
      if (!silhouette) {
        throw new Error(`Expected a silhouette payload for ${tile.title}`);
      }
      const allowed =
        silhouette.side === "FRONT" ? FRONT_REGION_IDS : BACK_REGION_IDS;
      for (const region of silhouette.regions) {
        expect(allowed).toContain(region);
      }
      expect(silhouette.centerY).toBeGreaterThan(0);
      expect(silhouette.centerY).toBeLessThan(1);
    }
  });
});
