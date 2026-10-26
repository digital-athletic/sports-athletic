import { Text } from "@/theme/Text";
import { act, fireEvent, render } from "@/utils/testUtils";
import { type TestInstance } from "test-renderer";
import { SwipeToDeleteRow } from "./SwipeToDeleteRow";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(async () => {
  await act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

type TouchEvent = { nativeEvent: { pageX: number; pageY: number } };

// fireEvent resolves to undefined since RNTL v14, so tests that assert on a
// responder handler's return value call the nearest handler directly.
const callResponderHandler = async (
  element: TestInstance,
  handlerName: string,
  event: TouchEvent,
): Promise<unknown> => {
  let owner: TestInstance | null = element;
  while (owner && typeof owner.props[handlerName] !== "function") {
    owner = owner.parent;
  }
  if (!owner) {
    throw new Error(`No ${handlerName} handler found`);
  }
  const handler: (event: TouchEvent) => unknown = owner.props[handlerName];
  let result: unknown;
  await act(() => {
    result = handler(event);
  });
  return result;
};

const ROW_TEXT = "My core";
const DELETE_LABEL = "Delete";

describe("SwipeToDeleteRow: content", () => {
  it("shows its children", async () => {
    const { getByText } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );

    expect(getByText(ROW_TEXT)).toBeTruthy();
  });

  it("hides the delete button before a swipe", async () => {
    const { queryByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });
});

describe("SwipeToDeleteRow: swiping", () => {
  it("shows the delete button after a long swipe to the left", async () => {
    const { getByText, getByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });

    expect(getByRole("button", { name: DELETE_LABEL })).toBeTruthy();
  });

  it("keeps the delete button hidden after a short swipe to the left", async () => {
    const { getByText, queryByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 280, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 280, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });

  it("keeps the delete button hidden after a swipe to the right", async () => {
    const { getByText, queryByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 100, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });

  it("hides the delete button again after a swipe to the right on an open row", async () => {
    const { getByText, queryByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });

  it("keeps the delete button visible after a short swipe to the right on an open row", async () => {
    const { getByText, getByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 170, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 170, pageY: 0 },
    });

    expect(getByRole("button", { name: DELETE_LABEL })).toBeTruthy();
  });

  it("keeps the delete button hidden when another view takes over the gesture", async () => {
    const { getByText, queryByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderTerminate", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });
});

describe("SwipeToDeleteRow: gesture claim", () => {
  it("claims a horizontal move", async () => {
    const { getByText } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    const claimed = await callResponderHandler(
      row,
      "onMoveShouldSetResponder",
      {
        nativeEvent: { pageX: 270, pageY: 5 },
      },
    );

    expect(claimed).toBe(true);
  });

  it("leaves a vertical move to the scroll view", async () => {
    const { getByText } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    const claimed = await callResponderHandler(
      row,
      "onMoveShouldSetResponder",
      {
        nativeEvent: { pageX: 290, pageY: 40 },
      },
    );

    expect(claimed).toBe(false);
  });

  it("leaves a tiny move to the pressed row", async () => {
    const { getByText } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    const claimed = await callResponderHandler(
      row,
      "onMoveShouldSetResponder",
      {
        nativeEvent: { pageX: 297, pageY: 0 },
      },
    );

    expect(claimed).toBe(false);
  });

  it("leaves a press on a closed row to the pressed row", async () => {
    const { getByText } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );

    const claimed = await callResponderHandler(
      getByText(ROW_TEXT),
      "onStartShouldSetResponderCapture",
      { nativeEvent: { pageX: 300, pageY: 0 } },
    );

    expect(claimed).toBe(false);
  });

  it("claims a press on an open row", async () => {
    const { getByText } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    const claimed = await callResponderHandler(
      row,
      "onStartShouldSetResponderCapture",
      { nativeEvent: { pageX: 150, pageY: 0 } },
    );

    expect(claimed).toBe(true);
  });

  it("blocks the native scroll view once it owns the gesture", async () => {
    const { getByText } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );

    const blocksNativeResponder = await callResponderHandler(
      getByText(ROW_TEXT),
      "onResponderGrant",
      { nativeEvent: { pageX: 300, pageY: 0 } },
    );

    expect(blocksNativeResponder).toBe(true);
  });
});

describe("SwipeToDeleteRow: tap", () => {
  it("hides the delete button when an open row is tapped", async () => {
    const { getByText, queryByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 152, pageY: 0 },
    });

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });
});

describe("SwipeToDeleteRow: delete button", () => {
  it("calls onDelete once when the delete button is pressed", async () => {
    const onDelete = jest.fn();
    const { getByText, getByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={onDelete}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent.press(getByRole("button", { name: DELETE_LABEL }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("closes the row when the delete button is pressed", async () => {
    const { getByText, getByRole, queryByRole } = await render(
      <SwipeToDeleteRow deleteLabel={DELETE_LABEL} onDelete={jest.fn()}>
        <Text>{ROW_TEXT}</Text>
      </SwipeToDeleteRow>,
    );
    const row = getByText(ROW_TEXT);

    await fireEvent(row, "startShouldSetResponderCapture", {
      nativeEvent: { pageX: 300, pageY: 0 },
    });
    await fireEvent(row, "responderMove", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent(row, "responderRelease", {
      nativeEvent: { pageX: 150, pageY: 0 },
    });
    await fireEvent.press(getByRole("button", { name: DELETE_LABEL }));

    expect(queryByRole("button", { name: DELETE_LABEL })).toBeNull();
  });
});
