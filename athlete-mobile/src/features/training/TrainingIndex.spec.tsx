import { render } from "@/utils/testUtils";
import TrainingIndex from "../../../app/training/index";

jest.mock("expo-router", () => {
  const { createElement } = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");
  return {
    Redirect: ({ href }: { href: string }) =>
      createElement(Text, { testID: "redirect" }, href),
  };
});

describe("TrainingIndex: the bare training route", () => {
  it("redirects to Home", async () => {
    const { getByTestId } = await render(<TrainingIndex />);

    expect(getByTestId("redirect").props.children).toBe("/(tabs)/(home)");
  });
});
