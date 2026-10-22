import { act, renderHook } from "@testing-library/react-native";
import { type ListRow } from "./useTrainingListRows";
import { useTrainingListSheet } from "./useTrainingListSheet";

// A minimal pending, non-test checklist row, e.g. a squat at index 0.
const generateChecklistRow = (overrides: Partial<ListRow> = {}): ListRow => ({
  index: 0,
  exerciseId: "squat",
  displayName: "Squat",
  isTest: false,
  isLastInSet: true,
  isFeedbackSkill: false,
  completed: false,
  ...overrides,
});

describe("useTrainingListSheet", () => {
  it("starts with no active row", () => {
    const rows = [generateChecklistRow()];

    const { result } = renderHook(() => useTrainingListSheet(rows));

    expect(result.current.activeRow).toBeNull();
  });

  it("opens the sheet for the row matching the given index", () => {
    const rows = [
      generateChecklistRow({ index: 0, exerciseId: "squat" }),
      generateChecklistRow({ index: 1, exerciseId: "lunge" }),
    ];

    const { result } = renderHook(() => useTrainingListSheet(rows));

    act(() => {
      result.current.openSheet(1);
    });

    expect(result.current.activeRow?.exerciseId).toBe("lunge");
  });

  it("closes the sheet, clearing the active row", () => {
    const rows = [generateChecklistRow()];

    const { result } = renderHook(() => useTrainingListSheet(rows));

    act(() => {
      result.current.openSheet(0);
    });
    expect(result.current.activeRow).not.toBeNull();

    act(() => {
      result.current.closeSheet();
    });

    expect(result.current.activeRow).toBeNull();
  });

  it("switches the active row when a different index is opened", () => {
    const rows = [
      generateChecklistRow({ index: 0, exerciseId: "squat" }),
      generateChecklistRow({ index: 1, exerciseId: "lunge" }),
    ];

    const { result } = renderHook(() => useTrainingListSheet(rows));

    act(() => {
      result.current.openSheet(0);
    });
    expect(result.current.activeRow?.exerciseId).toBe("squat");

    act(() => {
      result.current.openSheet(1);
    });
    expect(result.current.activeRow?.exerciseId).toBe("lunge");
  });
});
