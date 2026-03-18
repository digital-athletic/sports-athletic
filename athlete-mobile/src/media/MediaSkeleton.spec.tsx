import { fireEvent, render, screen } from "@/utils/testUtils";
import { MediaSkeleton } from "./MediaSkeleton";

describe("MediaSkeleton", () => {
  it("renders the retry button when onRetry is provided", () => {
    const mockRetry = jest.fn();
    render(<MediaSkeleton onRetry={mockRetry} />);
    expect(screen.getByText("Retry")).toBeTruthy();
  });

  it("calls onRetry callback when retry button is pressed", () => {
    const mockRetry = jest.fn();
    render(<MediaSkeleton onRetry={mockRetry} />);
    fireEvent.press(screen.getByRole("button"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("renders offline hint without retry when showRetry is false", () => {
    render(<MediaSkeleton showRetry={false} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("No connection")).toBeTruthy();
  });
});
