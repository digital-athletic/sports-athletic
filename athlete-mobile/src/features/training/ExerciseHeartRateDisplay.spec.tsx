import { createExerciseData } from "@/features/training/utils/testFixtures";
import { render, screen } from "@/utils/testUtils";
import { ExerciseHeartRateDisplay } from "./ExerciseHeartRateDisplay";

const currentYear = new Date().getFullYear();
const adultBirthday = `${currentYear - 30}-01-01`;

describe("ExerciseHeartRateDisplay: cardio skill filter", () => {
  it("renders the heart rate interval for a cardio skill tag", () => {
    render(
      <ExerciseHeartRateDisplay
        exerciseData={createExerciseData({ tags: ["SKILL_CARDIO_2"] })}
        birthday={adultBirthday}
      />,
    );
    expect(screen.getByText("Heart rate interval")).toBeTruthy();
  });

  it("shows MAX. instead of a heart rate range for sprint intervals", () => {
    render(
      <ExerciseHeartRateDisplay
        exerciseData={createExerciseData({ tags: ["SKILL_CARDIO_1_SHORT"] })}
        birthday={adultBirthday}
      />,
    );
    expect(screen.getByText("MAX.")).toBeTruthy();
    expect(screen.getByText("Heart rate interval")).toBeTruthy();
  });

  it("ignores the plain CARDIO tag itself and renders nothing without a specific cardio skill", () => {
    const { toJSON } = render(
      <ExerciseHeartRateDisplay
        exerciseData={createExerciseData({ tags: ["SKILL_CARDIO"] })}
        birthday={adultBirthday}
      />,
    );
    expect(toJSON()).toBeNull();
  });
});

describe("ExerciseHeartRateDisplay: undefined cardioSkill", () => {
  it("renders nothing when no cardio skill tag is present", () => {
    const { toJSON } = render(
      <ExerciseHeartRateDisplay
        exerciseData={createExerciseData({ tags: ["SKILL_STR"] })}
        birthday={adultBirthday}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders nothing when exerciseData is undefined", () => {
    const { toJSON } = render(
      <ExerciseHeartRateDisplay
        exerciseData={undefined}
        birthday={adultBirthday}
      />,
    );
    expect(toJSON()).toBeNull();
  });
});

describe("ExerciseHeartRateDisplay: missing or invalid birthday", () => {
  it.each([
    ["missing", ""],
    ["malformed", "invalid"],
    ["not a calendar date", "2010-13-45"],
  ])(
    "renders the interval for age 20 when the birthday is %s",
    (_, birthday) => {
      render(
        <ExerciseHeartRateDisplay
          exerciseData={createExerciseData({ tags: ["SKILL_CARDIO_2"] })}
          birthday={birthday}
        />,
      );
      expect(screen.getByText("175 - 194")).toBeTruthy();
    },
  );
});
