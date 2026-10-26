import { type Side } from "@/bodyParts/types";
import { fireEvent, render, screen } from "@/utils/testUtils";
import { type ComponentProps } from "react";
import { BodySilhouette } from "./BodySilhouette";
import { BACK_REGION_IDS, FRONT_REGION_IDS } from "./regionMapping";
import {
  distinctFills,
  regionPathHosts,
  SECONDARY_FILL,
  SELECTED_FILL,
  UNSELECTED_FILL,
} from "./svgTestUtils";
import { type SilhouetteGender, type SilhouetteRegionId } from "./types";

const identityLabel = (region: SilhouetteRegionId) => region;

type BaseOverrides = Partial<
  Pick<
    ComponentProps<typeof BodySilhouette>,
    | "gender"
    | "side"
    | "highlights"
    | "width"
    | "height"
    | "testID"
    | "regionTestIDPrefix"
  >
>;
type HandlerOverrides =
  | {
      onRegionPress: (region: SilhouetteRegionId) => void;
      getRegionLabel: (
        region: SilhouetteRegionId,
        highlighted: boolean,
      ) => string;
    }
  | { onRegionPress?: never; getRegionLabel?: never };

function renderSilhouette(overrides: BaseOverrides & HandlerOverrides = {}) {
  const { onRegionPress, getRegionLabel, ...rest } = overrides;
  const base = {
    gender: "MALE" as const,
    side: "FRONT" as const,
    highlights: [],
    width: 200,
    height: 200,
    testID: "body-silhouette",
    regionTestIDPrefix: "body-region-",
    ...rest,
  };
  if (onRegionPress && getRegionLabel) {
    return render(
      <BodySilhouette
        {...base}
        onRegionPress={onRegionPress}
        getRegionLabel={getRegionLabel}
      />,
    );
  }
  return render(<BodySilhouette {...base} />);
}

function wrapperView() {
  const root = screen.root;
  if (root === null) {
    throw new Error("BodySilhouette rendered no host element");
  }
  expect(root.type).toBe("View");
  return root;
}

describe("BodySilhouette: highlight color resolution", () => {
  it("fills two highlight groups with their own colors", async () => {
    await renderSilhouette({
      side: "BACK",
      highlights: [
        { regions: ["GLUTES_LEFT"], color: "primary" },
        { regions: ["GLUTES_RIGHT"], color: "primaryMuted" },
      ],
    });

    expect(distinctFills("body-region-GLUTES_LEFT")).toEqual([SELECTED_FILL]);
    expect(distinctFills("body-region-GLUTES_RIGHT")).toEqual([SECONDARY_FILL]);
    expect(distinctFills("body-region-HAMSTRINGS_LEFT")).toEqual([
      UNSELECTED_FILL,
    ]);
  });

  it("resolves an overlapping region to the first group's color", async () => {
    await renderSilhouette({
      side: "BACK",
      highlights: [
        { regions: ["GLUTES_LEFT"], color: "primary" },
        { regions: ["GLUTES_LEFT"], color: "primaryMuted" },
      ],
    });

    expect(distinctFills("body-region-GLUTES_LEFT")).toEqual([SELECTED_FILL]);
  });
});

describe("BodySilhouette: accessibility surface", () => {
  it("hides the subtree from assistive technology and touch when no handler is given", async () => {
    await renderSilhouette();

    const wrapper = wrapperView();
    expect(wrapper.props["aria-hidden"]).toBe(true);
    expect(wrapper.props.pointerEvents).toBe("none");
    expect(
      screen.queryAllByRole("checkbox", { includeHiddenElements: true }),
    ).toHaveLength(0);
  });

  it("labels every region when a handler is given", async () => {
    await renderSilhouette({
      onRegionPress: jest.fn(),
      getRegionLabel: identityLabel,
    });

    const unlabelled = FRONT_REGION_IDS.filter(
      (id) => screen.queryByLabelText(id) === null,
    );
    expect(unlabelled).toEqual([]);
  });

  it("calls back with the id of the pressed region", async () => {
    const onRegionPress = jest.fn();
    await renderSilhouette({ onRegionPress, getRegionLabel: identityLabel });

    await fireEvent.press(screen.getByLabelText("CHEST"));

    expect(onRegionPress).toHaveBeenCalledTimes(1);
    expect(onRegionPress).toHaveBeenCalledWith("CHEST");
  });
});

describe("BodySilhouette: region testID prefix", () => {
  it("applies the region testID prefix in interactive mode", async () => {
    await renderSilhouette({
      testID: "interactive-silhouette",
      regionTestIDPrefix: "interactive-region-",
      onRegionPress: jest.fn(),
      getRegionLabel: identityLabel,
    });

    expect(regionPathHosts("interactive-region-CHEST")).not.toHaveLength(0);
  });

  it("applies the region testID prefix in read only mode", async () => {
    await renderSilhouette({
      testID: "readonly-silhouette",
      regionTestIDPrefix: "readonly-region-",
    });

    expect(
      screen.getAllByTestId("readonly-region-CHEST", {
        includeHiddenElements: true,
      }),
    ).not.toHaveLength(0);
  });
});

describe("BodySilhouette: sizing", () => {
  it("applies a numeric size without an aspect ratio style", async () => {
    await renderSilhouette({ width: 140, height: 200 });

    const wrapper = wrapperView();
    expect(wrapper.props.style).toEqual(
      expect.objectContaining({ width: 140, height: 200 }),
    );
    expect(wrapper.props.style.aspectRatio).toBeUndefined();
  });

  it("applies a percentage size without an aspect ratio style", async () => {
    await renderSilhouette({ width: "100%", height: "100%" });

    const wrapper = wrapperView();
    expect(wrapper.props.style).toEqual(
      expect.objectContaining({ width: "100%", height: "100%" }),
    );
    expect(wrapper.props.style.aspectRatio).toBeUndefined();
  });
});

describe("BodySilhouette: asset coverage", () => {
  const combos: [SilhouetteGender, Side, readonly SilhouetteRegionId[]][] = [
    ["MALE", "FRONT", FRONT_REGION_IDS],
    ["MALE", "BACK", BACK_REGION_IDS],
    ["FEMALE", "FRONT", FRONT_REGION_IDS],
    ["FEMALE", "BACK", BACK_REGION_IDS],
  ];

  it.each(combos)(
    "renders a path for every mapped region id in the %s %s asset",
    async (gender, side, ids) => {
      await renderSilhouette({
        gender,
        side,
        testID: `${gender}-${side}-silhouette`,
        regionTestIDPrefix: `${gender}-${side}-region-`,
      });

      const missing = ids.filter(
        (id) =>
          screen.queryAllByTestId(`${gender}-${side}-region-${id}`, {
            includeHiddenElements: true,
          }).length === 0,
      );
      expect(missing).toEqual([]);
    },
  );
});
