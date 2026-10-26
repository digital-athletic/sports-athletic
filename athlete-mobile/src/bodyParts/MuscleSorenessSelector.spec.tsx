import { useUserProfileStore } from "@/store/userProfileStore";
import { fireEvent, render, screen, within } from "@/utils/testUtils";
import { MuscleSorenessSelector } from "./MuscleSorenessSelector";
import { femaleFront } from "./silhouette/paths/femaleFront";
import {
  regionFills,
  regionPathHosts,
  SELECTED_FILL,
  UNSELECTED_FILL,
} from "./silhouette/svgTestUtils";
import { type MuscleType } from "./types";
import { Dimensions } from "react-native";

function setGender(gender: "MALE" | "FEMALE") {
  useUserProfileStore.setState({
    personalData: {
      ...useUserProfileStore.getState().personalData,
      gender,
    },
  });
}

describe("MuscleSorenessSelector: region selection", () => {
  beforeEach(() => setGender("MALE"));

  it("shows the coaching prompt", async () => {
    await render(<MuscleSorenessSelector tags={[]} />);
    expect(screen.getByText("Where are the aching muscles?")).toBeTruthy();
  });

  it("emits the lateralized tag when a region is tapped", async () => {
    const onChange = jest.fn();
    await render(<MuscleSorenessSelector tags={[]} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText("left front thigh"));
    expect(onChange).toHaveBeenCalledWith(["QUADRICEPS_LEFT"]);
  });

  it("removes the tag when the same region is tapped again", async () => {
    const onChange = jest.fn();
    await render(
      <MuscleSorenessSelector tags={["QUADRICEPS_LEFT"]} onChange={onChange} />,
    );
    await fireEvent.press(screen.getByLabelText("left front thigh, selected"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("exposes the selected state in the native accessible name", async () => {
    await render(<MuscleSorenessSelector tags={["QUADRICEPS_LEFT"]} />);
    expect(screen.getByLabelText("left front thigh, selected")).toBeTruthy();
    expect(screen.getByLabelText("right front thigh")).toBeTruthy();
    expect(screen.queryByLabelText("right front thigh, selected")).toBeNull();
  });

  it("highlights only the tapped side, not its lateral counterpart", async () => {
    await render(<MuscleSorenessSelector tags={["QUADRICEPS_LEFT"]} />);
    const left = regionFills("silhouette-region-QUADRICEPS_LEFT");
    const right = regionFills("silhouette-region-QUADRICEPS_RIGHT");
    expect(left.length).toBeGreaterThan(0);
    expect(right.length).toBeGreaterThan(0);
    expect(left[0]).toEqual(SELECTED_FILL);
    expect(right[0]).toEqual(UNSELECTED_FILL);
  });

  it("keeps unknown legacy tags in the emitted array", async () => {
    const onChange = jest.fn();
    await render(
      <MuscleSorenessSelector tags={["SPINE"]} onChange={onChange} />,
    );
    await fireEvent.press(screen.getByLabelText("neck"));
    expect(onChange).toHaveBeenCalledWith(["SPINE", "NECK"]);
  });
});

describe("MuscleSorenessSelector: front and back toggle", () => {
  beforeEach(() => setGender("MALE"));

  it("starts on the front side and flips to the back", async () => {
    await render(<MuscleSorenessSelector tags={[]} />);
    expect(screen.getByLabelText("left front thigh")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Show back side"));
    expect(screen.getByLabelText("left back thigh")).toBeTruthy();
    expect(screen.getByLabelText("Show front side")).toBeTruthy();
  });

  it("preserves the selection across flips without emitting changes", async () => {
    const onChange = jest.fn();
    await render(
      <MuscleSorenessSelector tags={["QUADRICEPS_LEFT"]} onChange={onChange} />,
    );
    await fireEvent.press(screen.getByLabelText("Show back side"));
    await fireEvent.press(screen.getByLabelText("Show front side"));

    expect(onChange).not.toHaveBeenCalled();
    const left = regionFills("silhouette-region-QUADRICEPS_LEFT");
    expect(left.length).toBeGreaterThan(0);
    expect(left[0]).toEqual(SELECTED_FILL);
  });

  it("emits orientation precise shoulder tags per view", async () => {
    const onChange = jest.fn();
    await render(<MuscleSorenessSelector tags={[]} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText("left front shoulder"));
    expect(onChange).toHaveBeenLastCalledWith(["SHOULDER_FRONT_LEFT"]);
  });

  it("keeps a front shoulder selection off the rear shoulder view", async () => {
    await render(<MuscleSorenessSelector tags={["SHOULDER_FRONT_LEFT"]} />);
    await fireEvent.press(screen.getByLabelText("Show back side"));

    const backLeft = regionFills("silhouette-region-SHOULDER_LEFT");
    expect(backLeft.length).toBeGreaterThan(0);
    expect(backLeft[0]).toEqual(UNSELECTED_FILL);
    expect(screen.getByLabelText("left rear shoulder")).toBeTruthy();
  });

  it("shows a cross side selection as selected on the back view too", async () => {
    await render(<MuscleSorenessSelector tags={["ADDUCTORS_LEFT"]} />);
    await fireEvent.press(screen.getByLabelText("Show back side"));

    const backLeft = regionFills("silhouette-region-ADDUCTORS_LEFT");
    const backRight = regionFills("silhouette-region-ADDUCTORS_RIGHT");
    expect(backLeft.length).toBeGreaterThan(0);
    expect(backLeft[0]).toEqual(SELECTED_FILL);
    expect(backRight[0]).toEqual(UNSELECTED_FILL);
  });
});

describe("MuscleSorenessSelector: chips summary", () => {
  beforeEach(() => setGender("MALE"));

  it("lists selected tags as chips and removes a tag on chip press", async () => {
    const onChange = jest.fn();
    const tags: MuscleType[] = ["NECK", "GLUTES_LEFT"];
    await render(<MuscleSorenessSelector tags={tags} onChange={onChange} />);

    const chips = within(screen.getByTestId("selected-muscles"));
    expect(chips.getByText("left buttock")).toBeTruthy();

    await fireEvent.press(chips.getByLabelText("neck"));
    expect(onChange).toHaveBeenCalledWith(["GLUTES_LEFT"]);
  });
});

describe("MuscleSorenessSelector: gender awareness", () => {
  it("renders the female artwork for a female profile", async () => {
    setGender("FEMALE");
    await render(<MuscleSorenessSelector tags={[]} />);
    const neck = femaleFront.regions.find((region) => region.id === "NECK");
    const renderedNeckPaths = regionPathHosts("silhouette-region-NECK");
    expect(renderedNeckPaths.map((node) => node.props.d)).toEqual(neck?.paths);
  });
});

describe("MuscleSorenessSelector: figure size", () => {
  const portrait = { width: 750, height: 1334, scale: 2, fontScale: 2 };
  // Not the portrait size turned: a different number proves the window changed.
  const landscape = { width: 1000, height: 600, scale: 2, fontScale: 2 };

  afterEach(() => {
    Dimensions.set({ window: portrait, screen: portrait });
  });

  it("sizes the figure by the longer screen side in both orientations", async () => {
    setGender("MALE");
    Dimensions.set({ window: portrait, screen: portrait });
    const first = await render(<MuscleSorenessSelector tags={[]} />);
    expect(first.getByTestId("soreness-figure")).toHaveStyle({ height: 800 });
    await first.unmount();

    Dimensions.set({ window: landscape, screen: landscape });
    const second = await render(<MuscleSorenessSelector tags={[]} />);
    expect(second.getByTestId("soreness-figure")).toHaveStyle({ height: 600 });
    await second.unmount();
  });
});
