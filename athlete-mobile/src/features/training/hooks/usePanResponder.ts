import { useCallback, useRef, useState } from "react";
import { Animated, PanResponder } from "react-native";

interface PanResponderConfig {
  isTest: boolean;
  isLastInSet: boolean;
  onUpSwipe: () => void;
  onLeftSwipe: (feedbackType: "too_easy") => void;
  onRightSwipe: (feedbackType: "too_hard") => void;
}

/**
 * Custom hook managing pan responder for gesture-based navigation.
 */
export const usePanResponder = ({
  isTest,
  isLastInSet,
  onUpSwipe,
  onLeftSwipe,
  onRightSwipe,
}: PanResponderConfig) => {
  const [dx] = useState(() => new Animated.Value(0));
  const [dy] = useState(() => new Animated.Value(0));
  const lastNavEventFiredRef = useRef(0);
  const [panResponder, setPanResponder] = useState<ReturnType<
    typeof PanResponder.create
  > | null>(null);

  // Initialize pan responder once
  const initializePanResponder = useCallback(() => {
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return !(gestureState.dx === 0 && gestureState.dy === 0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // do not handle move if this identifier already triggered a navigation
        if (evt.nativeEvent.timestamp - lastNavEventFiredRef.current > 1000) {
          dx.setValue(gestureState.dx);
          dy.setValue(gestureState.dy);

          if (!isTest) {
            if (gestureState.dy < -100) {
              lastNavEventFiredRef.current = evt.nativeEvent.timestamp;
              onUpSwipe();
            } else if (gestureState.dx < -80 && isLastInSet) {
              lastNavEventFiredRef.current = evt.nativeEvent.timestamp;
              onLeftSwipe("too_easy");
            } else if (gestureState.dx > 80 && isLastInSet) {
              lastNavEventFiredRef.current = evt.nativeEvent.timestamp;
              onRightSwipe("too_hard");
            }
          }
        }
      },
      onPanResponderRelease: () => {
        dx.setValue(0);
        dy.setValue(0);
      },
    });
    setPanResponder(responder);
  }, [isTest, isLastInSet, onUpSwipe, onLeftSwipe, onRightSwipe, dx, dy]);

  return {
    panResponder,
    dx,
    dy,
    initializePanResponder,
    resetGestureValues: () => {
      dx.setValue(0);
      dy.setValue(0);
    },
  };
};
