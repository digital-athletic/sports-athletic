import { useState } from "react";

type Args = {
  onPause: () => void;
  onResume: () => void;
};

/**
 * Pause state of the exercise sheet's set timer. It lives in the sheet
 * content, so a new sheet session starts unpaused.
 */
export function useExerciseSheetPause({ onPause, onResume }: Args) {
  const [isPaused, setIsPaused] = useState(false);

  const onToggle = () => {
    if (isPaused) onResume();
    else onPause();
    setIsPaused(!isPaused);
  };

  return { isPaused, onToggle };
}
