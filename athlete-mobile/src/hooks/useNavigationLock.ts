import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

export type NavigationLock = {
  runLocked: (action: () => void) => void;
  release: () => void;
};

/**
 * Lets only the first call through until the screen regains focus or
 * release() is called, so a double tap navigates once.
 */
export function useNavigationLock(): NavigationLock {
  // A ref, not state: two taps in the same frame must see the lock at once.
  const lockedRef = useRef(false);

  const release = useCallback(() => {
    lockedRef.current = false;
  }, []);

  const runLocked = useCallback((action: () => void) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    action();
  }, []);

  useFocusEffect(release);

  return { runLocked, release };
}
