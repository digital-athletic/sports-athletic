import { act, renderHook } from "@testing-library/react-native";
import { useTrainingListFinish } from "./useTrainingListFinish";

const mockFinishTraining = jest.fn();

jest.mock("@/features/training/hooks/useFinishTraining", () => ({
  useFinishTraining: () => ({ finishTraining: mockFinishTraining }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderFinish = () =>
  renderHook(() =>
    useTrainingListFinish({
      allCompleted: true,
      endPause: jest.fn(),
      completeRestRows: jest.fn(),
    }),
  );

describe("useTrainingListFinish: finish button", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("disables the button while the training finishes", async () => {
    mockFinishTraining.mockReturnValue(true);
    const { result } = await renderFinish();

    await act(() => {
      result.current.handleFinish();
    });

    expect(result.current.isFinishing).toBe(true);
  });

  it("enables the button again when finishing fails", async () => {
    mockFinishTraining.mockReturnValue(false);
    const { result } = await renderFinish();

    await act(() => {
      result.current.handleFinish();
    });

    expect(result.current.isFinishing).toBe(false);
  });
});
