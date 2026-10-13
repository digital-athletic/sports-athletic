import { WorkoutConstants } from "@/constants/workoutConstants";
import { render } from "@/utils/testUtils";
import { PowerTest } from "./PowerTest";

const mockAgeGroup = jest.fn();

jest.mock("@/features/anamnesis/useAgeGroup", () => ({
  useAgeGroup: () => mockAgeGroup(),
}));

jest.mock("@/features/statistics/hooks/usePowerTestData", () => ({
  usePowerTestData: () => ({
    sortedHistory: [],
    hasHistory: false,
    hasChartData: false,
    anamnesisCompleted: true,
    toggleHistoryEntry: jest.fn(),
    isEntryExpanded: () => false,
  }),
}));

jest.mock("@/charts/PowerTest", () => ({
  PowerTest: () => null,
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe("PowerTest statistics: strength test entries", () => {
  it.each([
    WorkoutConstants.AGE_GROUPS.ADULT,
    WorkoutConstants.AGE_GROUPS.ADOLESCENT,
  ])("offers the test and the manual entry to the age group %s", (age) => {
    mockAgeGroup.mockReturnValue(age);
    const { queryByTestId } = render(<PowerTest />);

    expect(queryByTestId("power-test-start-button")).not.toBeNull();
    expect(queryByTestId("power-test-manual-input-button")).not.toBeNull();
  });

  it("offers neither the test nor the manual entry to a child", () => {
    mockAgeGroup.mockReturnValue(WorkoutConstants.AGE_GROUPS.CHILD);
    const { queryByTestId } = render(<PowerTest />);

    expect(queryByTestId("power-test-start-button")).toBeNull();
    expect(queryByTestId("power-test-manual-input-button")).toBeNull();
  });
});
