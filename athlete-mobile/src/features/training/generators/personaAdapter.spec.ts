import { WorkoutConstants } from "@/constants/workoutConstants";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import { getUserBirthday } from "@/features/training/utils/userDataUtils";
import {
  personaToUser,
  type Persona,
} from "@test/simulation/progression/personaAdapter";

const pinToday = (isoDate: string) =>
  jest.spyOn(Date, "now").mockReturnValue(new Date(isoDate).getTime());

const LATER_DATES = [
  { label: "today", isoDate: "2026-11-07" },
  { label: "in 2040", isoDate: "2040-06-15" },
];

describe("personaAdapter: personaToUser", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("derives the birthday as the first of January of the birth year", () => {
    pinToday("2026-11-07");
    const persona: Persona = {
      name: "male-advanced",
      gender: "MALE",
      age: 30,
      weight: 88,
      level: "ADVANCED",
    };

    expect(getUserBirthday(personaToUser(persona))).toBe("1996-01-01");
  });

  it("maps gender, weight, level and name into the user", () => {
    pinToday("2026-11-07");
    const persona: Persona = {
      name: "female-beginner",
      gender: "FEMALE",
      age: 30,
      weight: 66,
      level: "BEGINNER",
    };

    expect(personaToUser(persona)).toEqual({
      userId: "persona-female-beginner",
      personalData: { gender: "FEMALE", birthday: "1996-01-01", weight: 66 },
      workoutData: {
        tags: { LEVEL: ["BEGINNER"] },
        maxValues: DEFAULT_MAX_VALUES,
      },
      temporalData: [],
    });
  });

  it.each(LATER_DATES)(
    "keeps age 30 in the adult group $label",
    ({ isoDate }) => {
      pinToday(isoDate);
      const persona: Persona = {
        name: "male-advanced",
        gender: "MALE",
        age: 30,
        weight: 88,
        level: "ADVANCED",
      };

      const birthday = getUserBirthday(personaToUser(persona));

      expect(ageGroupFor(birthday)).toBe(WorkoutConstants.AGE_GROUPS.ADULT);
    },
  );

  it.each(LATER_DATES)(
    "keeps age 14 in the child group $label",
    ({ isoDate }) => {
      pinToday(isoDate);
      const persona: Persona = {
        name: "child-female",
        gender: "FEMALE",
        age: 14,
        weight: 55,
        level: "BEGINNER",
      };

      const birthday = getUserBirthday(personaToUser(persona));

      expect(ageGroupFor(birthday)).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    },
  );
});
