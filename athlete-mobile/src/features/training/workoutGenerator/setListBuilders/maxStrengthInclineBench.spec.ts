import { generateAthleteWithMaxValues } from "@test/factories/athlete";
import { generateValueExercise } from "@test/factories/valueExercise";
import { readMaxTrainingWeights } from "./maxStrengthLadder";

const athlete = generateAthleteWithMaxValues({ level: "ADVANCED" });

const flatBenchPress = generateValueExercise("repetition", {
  id: "bench",
  tags: ["EQ_TYPE_KG", "EXERCISE_DIRECTION_HORIZONTAL_PUSH"],
});
const inclineBenchPress = {
  ...flatBenchPress,
  tags: [...flatBenchPress.tags, "EQ_INCLINE_BENCH"],
};

describe("maxStrengthInclineBench: readMaxTrainingWeights", () => {
  it("lists working sets with a weight percentage above 0 for a weight exercise", () => {
    const { trainingWeights } = readMaxTrainingWeights(
      flatBenchPress,
      athlete,
      null,
      "MAX_STRENGTH",
    );

    expect(trainingWeights.length).toBeGreaterThan(0);
    expect(trainingWeights.every((weight) => weight > 0)).toBe(true);
  });

  // The incline factor already lowers the adjusted 1RM of the exercise, so the
  // percentages stay the same.
  it("uses the same percentages for an incline bench press as for a flat one", () => {
    expect(
      readMaxTrainingWeights(inclineBenchPress, athlete, null, "MAX_STRENGTH"),
    ).toEqual(
      readMaxTrainingWeights(flatBenchPress, athlete, null, "MAX_STRENGTH"),
    );
  });
});
