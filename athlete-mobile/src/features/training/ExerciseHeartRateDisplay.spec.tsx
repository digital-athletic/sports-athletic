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

describe("ExerciseHeartRateDisplay: undefined interval", () => {
  it("renders nothing when the birthday is invalid and no interval can be derived", () => {
    const { toJSON } = render(
      <ExerciseHeartRateDisplay
        exerciseData={createExerciseData({ tags: ["SKILL_CARDIO_2"] })}
        birthday="invalid"
      />,
    );
    expect(toJSON()).toBeNull();
  });
});
