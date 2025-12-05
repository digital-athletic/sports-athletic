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
  const dxRef = useRef(new Animated.Value(0));
  const dyRef = useRef(new Animated.Value(0));
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
          dxRef.current.setValue(gestureState.dx);
          dyRef.current.setValue(gestureState.dy);

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
        dxRef.current.setValue(0);
        dyRef.current.setValue(0);
      },
    });
    setPanResponder(responder);
  }, [isTest, isLastInSet, onUpSwipe, onLeftSwipe, onRightSwipe]);

  return {
    panResponder,
    dx: dxRef.current,
    dy: dyRef.current,
    initializePanResponder,
    resetGestureValues: () => {
      dxRef.current.setValue(0);
      dyRef.current.setValue(0);
    },
  };
};
