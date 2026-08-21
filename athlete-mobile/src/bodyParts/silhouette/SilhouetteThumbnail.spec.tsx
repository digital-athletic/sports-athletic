import {
  BACK_REGION_IDS,
  FRONT_REGION_IDS,
} from "@/bodyParts/silhouette/regionMapping";
import {
  PREVENTION_TILES,
  type TileData,
  type TileSilhouette,
} from "@/constants/workoutConstants";
import { render, screen } from "@/utils/testUtils";
import { parseViewBox, SILHOUETTES } from "./silhouetteData";
import { SilhouetteThumbnail, THUMBNAIL_INSET } from "./SilhouetteThumbnail";
import { SELECTED_FILL, thumbnailFills, UNSELECTED_FILL } from "./svgTestUtils";

function tileSilhouette(tile: TileData): TileSilhouette {
  if (!tile.silhouette) {
    throw new Error(`Expected a silhouette payload for ${tile.title}`);
  }
  return tile.silhouette;
}

const tileConfigs = PREVENTION_TILES.map((tile) => ({
  title: tile.title,
  ...tileSilhouette(tile),
}));

const spineConfig = tileConfigs.find((config) =>
  config.title.includes("SPINE"),
);

function getThumbnailHostProps() {
  return screen.getByTestId("silhouette-thumbnail", {
    includeHiddenElements: true,
  }).props;
}

describe("SilhouetteThumbnail: crop window invariants", () => {
  for (const gender of ["MALE", "FEMALE"] as const) {
    it(`renders a valid square crop window for every prevention tile for ${gender}`, () => {
      for (const config of tileConfigs) {
        render(
          <SilhouetteThumbnail
            gender={gender}
            side={config.side}
            regions={config.regions}
            centerY={config.centerY}
            size={96}
          />,
        );
        const asset = parseViewBox(SILHOUETTES[gender][config.side].viewBox);
        const { minX, minY, vbWidth, vbHeight } = getThumbnailHostProps();

        expect(minX).toBe(asset.minX);
        expect(vbWidth).toBeCloseTo(asset.width);
        expect(vbHeight).toBeCloseTo(asset.width);
        expect(minY).toBeGreaterThanOrEqual(asset.minY);
        expect(minY).toBeLessThanOrEqual(
          asset.minY + asset.height - asset.width,
        );
      }
    });
  }
});

describe("SilhouetteThumbnail: crop clamp", () => {
  it("clamps to the bottom edge when the window would run past it", () => {
    render(
      <SilhouetteThumbnail
        gender="MALE"
        side="BACK"
        regions={["CALF_LEFT", "CALF_RIGHT"]}
        centerY={0.83}
        size={96}
      />,
    );
    const asset = parseViewBox(SILHOUETTES.MALE.BACK.viewBox);
    const { minY } = getThumbnailHostProps();

    expect(minY).toBeCloseTo(asset.minY + asset.height - asset.width);
  });

  it("clamps to the top edge when the window would run past it", () => {
    render(
      <SilhouetteThumbnail
        gender="MALE"
        side="BACK"
        regions={["CALF_LEFT", "CALF_RIGHT"]}
        centerY={0}
        size={96}
      />,
    );
    const { minY } = getThumbnailHostProps();

    expect(minY).toBe(0);
  });
});

describe("SilhouetteThumbnail: golden crop value", () => {
  it("crops the male spine window at the reviewed position", () => {
    if (!spineConfig) {
      throw new Error("Expected a spine tile in PREVENTION_TILES");
    }
    render(
      <SilhouetteThumbnail
        gender="MALE"
        side={spineConfig.side}
        regions={spineConfig.regions}
        centerY={spineConfig.centerY}
        size={96}
      />,
    );
    const { minY } = getThumbnailHostProps();

    // 416.93 = 0.36 * 2292.22119 (maleBack height) minus 816.54338 / 2 (half
    // its width); pins the visually reviewed spine crop against constant edits.
    expect(minY).toBeCloseTo(416.9, 1);
  });
});

describe("SilhouetteThumbnail: region fill partition", () => {
  for (const config of tileConfigs) {
    it(`fills exactly the configured regions for ${config.title}`, () => {
      render(
        <SilhouetteThumbnail
          gender="MALE"
          side={config.side}
          regions={config.regions}
          centerY={config.centerY}
          size={96}
        />,
      );
      const sideRegionIds =
        config.side === "FRONT" ? FRONT_REGION_IDS : BACK_REGION_IDS;

      for (const regionId of sideRegionIds) {
        const expected = config.regions.includes(regionId)
          ? SELECTED_FILL
          : UNSELECTED_FILL;
        const fills = thumbnailFills(regionId);
        expect(fills.length).toBeGreaterThan(0);
        for (const fill of fills) {
          expect(fill).toEqual(expected);
        }
      }
    });
  }
});

describe("SilhouetteThumbnail: gender and asset switch", () => {
  it("renders the female asset paths and viewBox width for female gender", () => {
    render(
      <SilhouetteThumbnail
        gender="FEMALE"
        side="FRONT"
        regions={["WRIST_FLEXOR_LEFT", "WRIST_FLEXOR_RIGHT"]}
        centerY={0.37}
        size={96}
      />,
    );
    const femaleFront = SILHOUETTES.FEMALE.FRONT;
    const { vbWidth } = getThumbnailHostProps();
    const wristFlexorLeft = femaleFront.regions.find(
      (region) => region.id === "WRIST_FLEXOR_LEFT",
    );
    const renderedPaths = screen.getAllByTestId(
      "silhouette-thumbnail-region-WRIST_FLEXOR_LEFT",
      { includeHiddenElements: true },
    );

    expect(vbWidth).toBeCloseTo(parseViewBox(femaleFront.viewBox).width);
    expect(renderedPaths.map((node) => node.props.d)).toEqual(
      wristFlexorLeft?.paths,
    );
  });
});

describe("SilhouetteThumbnail: layout inset", () => {
  it("insets the artwork inside the tile slot so whitespace surrounds it", () => {
    render(
      <SilhouetteThumbnail
        gender="MALE"
        side="BACK"
        regions={["UPPER_BACK", "LOWER_BACK"]}
        centerY={0.36}
        size={96}
      />,
    );
    const wrapper = screen.getByTestId("silhouette-thumbnail-wrapper", {
      includeHiddenElements: true,
    });
    const svg = screen.getByTestId("silhouette-thumbnail", {
      includeHiddenElements: true,
    });

    expect(wrapper.props.style).toEqual(
      expect.objectContaining({
        width: 96,
        height: 96,
        padding: 96 * THUMBNAIL_INSET,
      }),
    );
    expect(svg.props.width).toBeCloseTo(96 * (1 - 2 * THUMBNAIL_INSET));
    expect(svg.props.height).toBeCloseTo(96 * (1 - 2 * THUMBNAIL_INSET));
  });
});

describe("SilhouetteThumbnail: accessibility surface", () => {
  it("hides the whole subtree from assistive technology and touch", () => {
    render(
      <SilhouetteThumbnail
        gender="MALE"
        side="BACK"
        regions={["UPPER_BACK", "LOWER_BACK"]}
        centerY={0.36}
        size={96}
      />,
    );
    const wrapper = screen.getByTestId("silhouette-thumbnail-wrapper", {
      includeHiddenElements: true,
    });

    expect(wrapper.props["aria-hidden"]).toBe(true);
    expect(wrapper.props.pointerEvents).toBe("none");
    expect(
      screen.queryAllByRole("checkbox", { includeHiddenElements: true }),
    ).toHaveLength(0);
  });
});
