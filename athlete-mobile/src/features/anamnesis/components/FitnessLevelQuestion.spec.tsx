import { fireEvent, render, screen } from "@/utils/testUtils";
import { FitnessLevelQuestion } from "./FitnessLevelQuestion";

const noop = jest.fn();

describe("FitnessLevelQuestion: level cards", () => {
  it("shows beginner as checked when no level is stored", async () => {
    await render(
      <FitnessLevelQuestion
        values={{}}
        tags={{}}
        onChangeValue={noop}
        onChangeTag={noop}
      />,
    );

    expect(screen.getByRole("radio", { name: "Beginner" })).toBeChecked();
  });

  it("explains each level on its card", async () => {
    await render(
      <FitnessLevelQuestion
        values={{}}
        tags={{ LEVEL: ["ADVANCED"] }}
        onChangeValue={noop}
        onChangeTag={noop}
      />,
    );

    expect(screen.getByRole("radio", { name: "Advanced" })).toBeChecked();
    expect(
      screen.getByText("For over 6 months, at least once a week"),
    ).toBeTruthy();
  });

  it("stores the level of the pressed card", async () => {
    const onChangeTag = jest.fn();
    await render(
      <FitnessLevelQuestion
        values={{}}
        tags={{ LEVEL: ["BEGINNER"] }}
        onChangeValue={noop}
        onChangeTag={onChangeTag}
      />,
    );

    await fireEvent.press(screen.getByRole("radio", { name: "Professional" }));

    expect(onChangeTag).toHaveBeenCalledWith("LEVEL", ["PROFESSIONAL"]);
  });
});
