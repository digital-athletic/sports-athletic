import { Ionicon } from "@/common/Ionicon";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { createContext, type FC, use } from "react";
import { useTranslation } from "react-i18next";

export interface SwapExerciseButtonProps {
  exerciseName: string;
  onPress: () => void;
}

/** Replaces an exercise of the training overview with the next alternative. */
export const SwapExerciseButton: FC<SwapExerciseButtonProps> = ({
  exerciseName,
  onPress,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TouchableBox
      onPress={onPress}
      minWidth={44}
      minHeight={44}
      justifyContent="center"
      alignItems="center"
      accessibilityRole="button"
      accessibilityLabel={t("training.overview.swapExercise", {
        name: exerciseName,
      })}
      testID="swap-exercise-button"
    >
      <Ionicon name="swap-horizontal" size={24} color={colors.darkGrey2} />
    </TouchableBox>
  );
};

export interface SwapControls {
  canSwap: (branchId: string | undefined) => boolean;
  onSwap: (branchId: string | undefined) => void;
}

/** Swap controls of the training overview; without a provider nothing swaps. */
export const SwapControlsContext = createContext<SwapControls>({
  canSwap: () => false,
  onSwap: () => undefined,
});

export interface SwapExerciseSlotProps {
  branchId: string | undefined;
  exerciseName: string;
}

/** The swap button of an exercise when its branch has alternatives. */
export const SwapExerciseSlot: FC<SwapExerciseSlotProps> = ({
  branchId,
  exerciseName,
}) => {
  const { canSwap, onSwap } = use(SwapControlsContext);
  if (!canSwap(branchId)) return null;
  return (
    <SwapExerciseButton
      exerciseName={exerciseName}
      onPress={() => onSwap(branchId)}
    />
  );
};
