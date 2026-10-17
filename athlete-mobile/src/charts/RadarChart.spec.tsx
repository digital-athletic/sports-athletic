import type { UserSkills } from "@/features/statistics/models/WorkoutsData";
import { render } from "@/utils/testUtils";
import { RadarChart } from "./RadarChart";

// Capture props passed to the chart library
let capturedProps: Record<string, unknown> | null = null;

jest.mock("react-native-gifted-charts", () => ({
  RadarChart: (props: Record<string, unknown>) => {
    capturedProps = props;
    const { View } = require("react-native");
    return <View testID="gifted-radar-chart" />;
  },
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

describe("RadarChart", () => {
  beforeEach(() => {
    capturedProps = null;
  });

  describe("data transformation", () => {
    it("adds centerOffset (10) to each percentage value", () => {
      const userSkills: UserSkills = {
        MOBILITY: 20,
        PREVENTION: 15,
        CARDIO: 10,
        STABILITY: 25,
        WARMUP: 20,
        SWR: 10,
      };

      render(<RadarChart userSkills={userSkills} />);

      expect(capturedProps?.data).toEqual([30, 25, 20, 35, 30, 20]);
    });

    it("caps values at maxValue (50) when percentage + offset exceeds it", () => {
      const userSkills: UserSkills = {
        MOBILITY: 80,
        PREVENTION: 5,
        CARDIO: 5,
        STABILITY: 5,
        WARMUP: 3,
        SWR: 2,
      };

      render(<RadarChart userSkills={userSkills} />);

      // MOBILITY: 80% + 10 = 90, capped at 50; others get +10 offset
      expect(capturedProps?.data).toEqual([50, 15, 15, 15, 13, 12]);
    });

    it("handles zero values by applying only the centerOffset", () => {
      const userSkills: UserSkills = {
        MOBILITY: 0,
        PREVENTION: 0,
        CARDIO: 0,
        STABILITY: 0,
        WARMUP: 0,
        SWR: 0,
      };

      render(<RadarChart userSkills={userSkills} />);

      expect(capturedProps?.data).toEqual([10, 10, 10, 10, 10, 10]);
    });
  });

  describe("label generation", () => {
    it("formats labels as skill name with percentage on new line", () => {
      const userSkills: UserSkills = {
        MOBILITY: 30,
        PREVENTION: 25,
        CARDIO: 15,
        STABILITY: 12,
        WARMUP: 10,
        SWR: 8,
      };

      render(<RadarChart userSkills={userSkills} />);

      expect(capturedProps?.labels).toEqual([
        "Mobility\n30%",
        "Prevention\n25%",
        "Endurance\n15%",
        "Stability\n12%",
        "Warm-up\n10%",
        "Strength\n8%",
      ]);
    });
  });

  describe("screen reader summary", () => {
    it("labels the chart with every skill and its percentage", () => {
      const userSkills: UserSkills = {
        MOBILITY: 30,
        PREVENTION: 25,
        CARDIO: 15,
        STABILITY: 12,
        WARMUP: 10,
        SWR: 8,
      };

      const { getByTestId } = render(<RadarChart userSkills={userSkills} />);

      expect(
        getByTestId("radar-chart-container").props.accessibilityLabel,
      ).toBe(
        "Skill profile: Mobility 30%, Prevention 25%, Endurance 15%, Stability 12%, Warm-up 10%, Strength 8%",
      );
    });
  });

  describe("chart configuration", () => {
    it("passes correct layout and styling configuration", () => {
      const userSkills: UserSkills = {
        MOBILITY: 20,
        PREVENTION: 15,
        CARDIO: 10,
        STABILITY: 25,
        WARMUP: 20,
        SWR: 10,
      };

      render(<RadarChart userSkills={userSkills} />);

      expect(capturedProps).toMatchObject({
        circular: true,
        startAngle: 90,
        isClockWise: true,
        maxValue: 50,
      });
    });
  });
});
