import { AppIcon } from "@/common/AppIcon";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { createContext, type FC, use } from "react";
import { useTranslation } from "react-i18next";
import IconSwitchHorizontal from "@tabler/icons-react-native/IconSwitchHorizontal";

export interface SwapControls {
  /** Whether the workout offers the exercise swap and its swap setup exists. */
  supported: boolean;
  canSwap: (branchId: string | undefined) => boolean;
  onSwap: (branchId: string | undefined) => void;
}

/** Swap controls of the training overview; without a provider nothing swaps. */
export const SwapControlsContext = createContext<SwapControls>({
  supported: false,
  canSwap: () => false,
  onSwap: () => undefined,
});

interface SwapExerciseButtonProps {
  branchId: string | undefined;
  exerciseName: string;
}

/**
 * Replaces an exercise with its next alternative. An exercise without an
 * alternative shows the button greyed out and disabled.
 */
export const SwapExerciseButton: FC<SwapExerciseButtonProps> = ({
  branchId,
  exerciseName,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { supported, canSwap, onSwap } = use(SwapControlsContext);
  if (!supported) return null;
  const swappable = canSwap(branchId);

  return (
    <TouchableBox
      onPress={() => onSwap(branchId)}
      minWidth={44}
      minHeight={44}
      justifyContent="center"
      alignItems="center"
      accessibilityRole="button"
      disabled={!swappable}
      accessibilityState={{ disabled: !swappable }}
      accessibilityLabel={t(
        swappable
          ? "training.overview.swapExercise"
          : "training.overview.swapExerciseUnavailable",
        { name: exerciseName },
      )}
      testID="swap-exercise-button"
    >
      <AppIcon
        icon={IconSwitchHorizontal}
        size={24}
        color={swappable ? colors.darkGrey2 : colors.lightGrey3}
      />
    </TouchableBox>
  );
};
