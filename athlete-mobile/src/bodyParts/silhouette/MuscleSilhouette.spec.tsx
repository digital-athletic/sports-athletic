import { fireEvent, render, screen } from "@/utils/testUtils";
import { MuscleSilhouette } from "./MuscleSilhouette";
import { femaleFront } from "./paths/femaleFront";
import { BACK_REGION_IDS, FRONT_REGION_IDS } from "./regionMapping";
import {
  regionFills,
  regionPathHosts,
  SELECTED_FILL,
  UNSELECTED_FILL,
} from "./svgTestUtils";
import { type SilhouetteRegionId } from "./types";

const identityLabel = (region: SilhouetteRegionId) => region;

describe("MuscleSilhouette: region rendering", () => {
  it("renders all 18 front regions with accessible labels", () => {
    render(
      <MuscleSilhouette
        gender="MALE"
        side="FRONT"
        selectedRegions={[]}
        getRegionLabel={identityLabel}
      />,
    );
    for (const id of FRONT_REGION_IDS) {
      expect(screen.getByLabelText(id)).toBeTruthy();
    }
  });

  it("renders all 18 back regions with accessible labels", () => {
    render(
      <MuscleSilhouette
        gender="FEMALE"
        side="BACK"
        selectedRegions={[]}
        getRegionLabel={identityLabel}
      />,
    );
    for (const id of BACK_REGION_IDS) {
      expect(screen.getByLabelText(id)).toBeTruthy();
    }
  });

  it("exposes exactly 18 tappable regions and no BODY region", () => {
    render(
      <MuscleSilhouette
        gender="MALE"
        side="FRONT"
        selectedRegions={[]}
        getRegionLabel={identityLabel}
      />,
    );
    expect(screen.getAllByTestId(/^silhouette-region-/)).toHaveLength(18);
    expect(screen.queryByTestId("silhouette-region-BODY")).toBeNull();
    expect(screen.queryByLabelText("BODY")).toBeNull();
  });

  it("uses the female data set for female gender", () => {
    render(
      <MuscleSilhouette
        gender="FEMALE"
        side="FRONT"
        selectedRegions={[]}
        getRegionLabel={identityLabel}
      />,
    );
    const neck = femaleFront.regions.find((region) => region.id === "NECK");
    const renderedNeckPaths = regionPathHosts("silhouette-region-NECK");
    expect(renderedNeckPaths.map((node) => node.props.d)).toEqual(neck?.paths);
  });
});

describe("MuscleSilhouette: interaction and selection", () => {
  it("calls onRegionPress with the region id", () => {
    const onRegionPress = jest.fn();
    render(
      <MuscleSilhouette
        gender="MALE"
        side="FRONT"
        selectedRegions={[]}
        onRegionPress={onRegionPress}
        getRegionLabel={identityLabel}
      />,
    );
    fireEvent.press(screen.getByLabelText("CHEST"));
    expect(onRegionPress).toHaveBeenCalledTimes(1);
    expect(onRegionPress).toHaveBeenCalledWith("CHEST");
  });

  it("fills selected regions differently from unselected ones", () => {
    render(
      <MuscleSilhouette
        gender="MALE"
        side="BACK"
        selectedRegions={["GLUTES_LEFT"]}
        getRegionLabel={identityLabel}
      />,
    );
    const selectedFills = regionFills("silhouette-region-GLUTES_LEFT");
    const unselectedFills = regionFills("silhouette-region-GLUTES_RIGHT");
    expect(selectedFills.length).toBeGreaterThan(0);
    expect(unselectedFills.length).toBeGreaterThan(0);
    expect(new Set(selectedFills).size).toBe(1);
    expect(selectedFills[0]).toEqual(SELECTED_FILL);
    expect(unselectedFills[0]).toEqual(UNSELECTED_FILL);
  });
});
