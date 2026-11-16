import { fireEvent, render, screen } from "@/utils/testUtils";
import { Path } from "react-native-svg";
import { SilhouetteRegionGroup } from "./SilhouetteRegionGroup.web";

// The region renders a plain DOM group, which the native queries cannot match
// by role or testID, so the tests read it as the root element.
function getRenderedGroup() {
  const group = screen.root;
  if (!group) throw new Error("The region rendered nothing");
  return group;
}

describe("SilhouetteRegionGroup: web muscle region", () => {
  it("selects the region on a click", async () => {
    const onPress = jest.fn();
    await render(
      <SilhouetteRegionGroup
        label="left front thigh"
        checked={false}
        testID="silhouette-region-LEFT_FRONT_THIGH"
        onPress={onPress}
      >
        <Path d="M0 0 L10 10" />
      </SilhouetteRegionGroup>,
    );

    await fireEvent(getRenderedGroup(), "click");

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a DOM group that carries no touch responder handlers", async () => {
    await render(
      <SilhouetteRegionGroup
        label="left front thigh"
        checked
        testID="silhouette-region-LEFT_FRONT_THIGH"
        onPress={jest.fn()}
      >
        <Path d="M0 0 L10 10" />
      </SilhouetteRegionGroup>,
    );

    const group = getRenderedGroup();
    expect(group.type).toBe("g");
    expect(group.props).not.toHaveProperty("onPress");
    expect(group.props).not.toHaveProperty("onStartShouldSetResponder");
  });

  it("exposes the region as a labelled checkbox with its checked state and test id", async () => {
    await render(
      <SilhouetteRegionGroup
        label="left front thigh"
        checked
        testID="silhouette-region-LEFT_FRONT_THIGH"
        onPress={jest.fn()}
      >
        <Path d="M0 0 L10 10" />
      </SilhouetteRegionGroup>,
    );

    const group = getRenderedGroup();
    expect(group.props).toMatchObject({
      role: "checkbox",
      "aria-label": "left front thigh",
      "aria-checked": "true",
      "data-testid": "silhouette-region-LEFT_FRONT_THIGH",
    });
  });
});
