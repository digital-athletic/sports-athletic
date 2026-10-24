import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC, type PropsWithChildren, useRef, useState } from "react";
import {
  Animated,
  type GestureResponderEvent,
  type ViewProps,
} from "react-native";

const DELETE_BUTTON_WIDTH = 88;
const MIN_SWIPE_DISTANCE = 10;
const SNAP_DURATION_MS = 150;

type SwipeToDeleteRowProps = PropsWithChildren<{
  /** Already translated. */
  deleteLabel: string;
  onDelete: () => void;
}>;

const clampRowOffset = (offset: number) =>
  Math.min(0, Math.max(-DELETE_BUTTON_WIDTH, offset));

type SwipeResponderHandlers = Pick<
  ViewProps,
  | "onStartShouldSetResponderCapture"
  | "onMoveShouldSetResponder"
  | "onResponderGrant"
  | "onResponderTerminationRequest"
  | "onResponderMove"
  | "onResponderRelease"
  | "onResponderTerminate"
>;

const useSwipeRowGesture = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rowOffset] = useState(() => new Animated.Value(0));
  const touchStart = useRef({ pageX: 0, pageY: 0 });
  const openOffset = isOpen ? -DELETE_BUTTON_WIDTH : 0;

  const snapRow = (open: boolean) => {
    setIsOpen(open);
    Animated.timing(rowOffset, {
      toValue: open ? -DELETE_BUTTON_WIDTH : 0,
      duration: SNAP_DURATION_MS,
      useNativeDriver: false,
    }).start();
  };

  const readSwipeDistance = ({ nativeEvent }: GestureResponderEvent) => ({
    dx: nativeEvent.pageX - touchStart.current.pageX,
    dy: nativeEvent.pageY - touchStart.current.pageY,
  });

  const responderHandlers: SwipeResponderHandlers = {
    // Records the start for touch and mouse alike, since react-native-web fires
    // no touchstart for a mouse. Claims presses on an open row so a tap closes it.
    onStartShouldSetResponderCapture: ({ nativeEvent }) => {
      touchStart.current = {
        pageX: nativeEvent.pageX,
        pageY: nativeEvent.pageY,
      };
      return isOpen;
    },
    onMoveShouldSetResponder: (event) => {
      const { dx, dy } = readSwipeDistance(event);
      return Math.abs(dx) > MIN_SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy);
    },
    // Returning true blocks the native Android scroll view from cancelling the swipe.
    onResponderGrant: () => true,
    // Refuses JS responder transfers once the swipe started.
    onResponderTerminationRequest: () => false,
    onResponderMove: (event) => {
      rowOffset.setValue(
        clampRowOffset(openOffset + readSwipeDistance(event).dx),
      );
    },
    onResponderRelease: (event) => {
      const { dx } = readSwipeDistance(event);
      const isTap = Math.abs(dx) <= MIN_SWIPE_DISTANCE;
      snapRow(!isTap && openOffset + dx < -DELETE_BUTTON_WIDTH / 2);
    },
    onResponderTerminate: () => snapRow(isOpen),
  };

  return {
    isOpen,
    rowOffset,
    closeRow: () => snapRow(false),
    responderHandlers,
  };
};

/** Reveals a delete button behind the row when the row is swiped to the left. */
export const SwipeToDeleteRow: FC<SwipeToDeleteRowProps> = ({
  deleteLabel,
  onDelete,
  children,
}) => {
  const { isOpen, rowOffset, closeRow, responderHandlers } =
    useSwipeRowGesture();

  const pressDelete = () => {
    closeRow();
    onDelete();
  };

  return (
    <Box position="relative" overflow="hidden">
      <Box
        position="absolute"
        top={0}
        bottom={0}
        right={0}
        width={DELETE_BUTTON_WIDTH}
        backgroundColor="error"
        aria-hidden={!isOpen}
      >
        <TouchableBox
          flex={1}
          justifyContent="center"
          alignItems="center"
          onPress={pressDelete}
          disabled={!isOpen}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
        >
          <Text variant="body" color="white">
            {deleteLabel}
          </Text>
        </TouchableBox>
      </Box>
      <Animated.View
        testID="swipe-to-delete-row"
        style={{ transform: [{ translateX: rowOffset }] }}
        {...responderHandlers}
      >
        {children}
      </Animated.View>
    </Box>
  );
};
