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
  it("starts with no active row", async () => {
    const rows = [generateChecklistRow()];

    const { result } = await renderHook(() => useTrainingListSheet(rows));

    expect(result.current.activeRow).toBeNull();
  });

  it("opens the sheet for the row matching the given index", async () => {
    const rows = [
      generateChecklistRow({ index: 0, exerciseId: "squat" }),
      generateChecklistRow({ index: 1, exerciseId: "lunge" }),
    ];

    const { result } = await renderHook(() => useTrainingListSheet(rows));

    await act(() => {
      result.current.openSheet(1);
    });

    expect(result.current.activeRow?.exerciseId).toBe("lunge");
  });

  it("closes the sheet, clearing the active row but keeping the shown row", async () => {
    const rows = [generateChecklistRow()];

    const { result } = await renderHook(() => useTrainingListSheet(rows));

    await act(() => {
      result.current.openSheet(0);
    });
    expect(result.current.activeRow).not.toBeNull();

    await act(() => {
      result.current.closeSheet();
    });

    expect(result.current.activeRow).toBeNull();
    expect(result.current.shownRow?.exerciseId).toBe("squat");
  });

  it("starts a new session each time the sheet opens, even for the same row", async () => {
    const rows = [generateChecklistRow()];

    const { result } = await renderHook(() => useTrainingListSheet(rows));

    await act(() => {
      result.current.openSheet(0);
    });
    const firstSession = result.current.session;

    await act(() => {
      result.current.closeSheet();
    });
    await act(() => {
      result.current.openSheet(0);
    });

    expect(result.current.session).toBe(firstSession + 1);
  });

  it("switches the active row when a different index is opened", async () => {
    const rows = [
      generateChecklistRow({ index: 0, exerciseId: "squat" }),
      generateChecklistRow({ index: 1, exerciseId: "lunge" }),
    ];

    const { result } = await renderHook(() => useTrainingListSheet(rows));

    await act(() => {
      result.current.openSheet(0);
    });
    expect(result.current.activeRow?.exerciseId).toBe("squat");

    await act(() => {
      result.current.openSheet(1);
    });
    expect(result.current.activeRow?.exerciseId).toBe("lunge");
  });
});
