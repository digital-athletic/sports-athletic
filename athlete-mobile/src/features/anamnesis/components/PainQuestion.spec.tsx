import { fireEvent, render, screen } from "@/utils/testUtils";
import { PainQuestion } from "./PainQuestion";

const noop = jest.fn();

describe("PainQuestion: stored pain tags", () => {
  it("shows stored joint regions as selected and hides stale muscle values", async () => {
    await render(
      <PainQuestion
        values={{}}
        tags={{ PAIN: ["KNEE_LEFT", "GLUTES"] }}
        onChangeValue={noop}
        onChangeTag={noop}
      />,
    );
    expect(screen.getByLabelText("left knee")).toBeSelected();
    expect(screen.queryByLabelText("buttock")).toBeNull();
  });

  it("drops stale muscle values from the next change", async () => {
    const onChangeTag = jest.fn();
    await render(
      <PainQuestion
        values={{}}
        tags={{ PAIN: ["KNEE_LEFT", "GLUTES"] }}
        onChangeValue={noop}
        onChangeTag={onChangeTag}
      />,
    );
    await fireEvent.press(screen.getByLabelText("right knee"));
    expect(onChangeTag).toHaveBeenCalledWith("PAIN", [
      "KNEE_LEFT",
      "KNEE_RIGHT",
    ]);
  });
});
