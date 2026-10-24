import { Text } from "@/theme/Text";
import { act, fireEvent, render } from "@/utils/testUtils";
import { SwipeToDeleteRow } from "./SwipeToDeleteRow";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

const ROW_TEXT = "My core";
const DELETE_LABEL = "Delete";

describe("SwipeToDeleteRow: content", () => {
  it("shows its children", () => {
    const { getByText } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );

    expect(getByText(ROW_TEXT)).toBeTruthy();
  });

  it("hides the delete button before a swipe", () => {
    const { queryByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });
});

describe("SwipeToDeleteRow: swiping", () => {
  it("shows the delete button after a long swipe to the left", () => {
    const { getByText, getByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 150, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });

    expect(getByRole("button", { name: DELETE_LABEL })).toBeTruthy();
  });

  it("keeps the delete button hidden after a short swipe to the left", () => {
    const { getByText, queryByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 280, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 280, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });

  it("keeps the delete button hidden after a swipe to the right", () => {
    const { getByText, queryByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 100, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 300, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });

  it("hides the delete button again after a swipe to the right on an open row", () => {
    const { getByText, queryByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 150, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 300, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });

  it("keeps the delete button visible after a short swipe to the right on an open row", () => {
    const { getByText, getByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 150, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 170, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 170, pageY: 0 },
    });

    expect(getByRole("button", { name: DELETE_LABEL })).toBeTruthy();
  });

  it("keeps the delete button hidden when another view takes over the gesture", () => {
    const { getByText, queryByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 150, pageY: 0 } });
    fireEvent(row, "responderTerminate", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });
});

describe("SwipeToDeleteRow: gesture claim", () => {
  it("claims a horizontal move", () => {
    const { getByText } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    const claimed: unknown = fireEvent(row, "moveShouldSetResponder", {
      nativeEvent: { pageX: 270, pageY: 5 },
    });

    expect(claimed).toBe(true);
  });

  it("leaves a vertical move to the scroll view", () => {
    const { getByText } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    const claimed: unknown = fireEvent(row, "moveShouldSetResponder", {
      nativeEvent: { pageX: 290, pageY: 40 },
    });

    expect(claimed).toBe(false);
  });

  it("leaves a tiny move to the pressed row", () => {
    const { getByText } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    const claimed: unknown = fireEvent(row, "moveShouldSetResponder", {
      nativeEvent: { pageX: 297, pageY: 0 },
    });

    expect(claimed).toBe(false);
  });

  it("leaves a press on a closed row to the pressed row", () => {
    const { getByText } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );

    const claimed: unknown = fireEvent(
      getByText(ROW_TEXT),
      "startShouldSetResponderCapture",
      { nativeEvent: { pageX: 300, pageY: 0 } },
    );

    expect(claimed).toBe(false);
  });

  it("claims a press on an open row", () => {
    const { getByText } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 150, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    const claimed: unknown = fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });

    expect(claimed).toBe(true);
  });

  it("blocks the native scroll view once it owns the gesture", () => {
    const { getByText } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );

    const blocksNativeResponder: unknown = fireEvent(
      getByText(ROW_TEXT),
      "responderGrant",
      { nativeEvent: { pageX: 300, pageY: 0 } },
    );

    expect(blocksNativeResponder).toBe(true);
  });
});

describe("SwipeToDeleteRow: tap", () => {
  it("hides the delete button when an open row is tapped", () => {
    const { getByText, queryByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 150, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 152, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });
});

describe("SwipeToDeleteRow: delete button", () => {
  it("calls onDelete once when the delete button is pressed", () => {
    const onDelete = jest.fn();
    const { getByText, getByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={onDelete}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 150, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    fireEvent.press(getByRole("button", { name: DELETE_LABEL }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("closes the row when the delete button is pressed", () => {
    const { getByText, getByRole, queryByRole } = render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    fireEvent(row, "responderMove", { nativeEvent: { pageX: 150, pageY: 0 } });
    fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    fireEvent.press(getByRole("button", { name: DELETE_LABEL }));

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });
});
