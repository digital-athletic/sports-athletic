import { AppIcon } from "@/common/AppIcon";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { createContext, type FC, use } from "react";
import { useTranslation } from "react-i18next";
import IconSwitchHorizontal from "@tabler/icons-react-native/IconSwitchHorizontal";

export interface SwapControls {
  canSwap: (branchId: string | undefined) => boolean;
  onSwap: (branchId: string | undefined) => void;
}

/** Swap controls of the training overview; without a provider nothing swaps. */
export const SwapControlsContext = createContext<SwapControls>({
  canSwap: () => false,
  onSwap: () => undefined,
});

interface SwapExerciseButtonProps {
  branchId: string | undefined;
  exerciseName: string;
}

/** Replaces an exercise with its next alternative when its branch has one. */
export const SwapExerciseButton: FC<SwapExerciseButtonProps> = ({
  branchId,
  exerciseName,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { canSwap, onSwap } = use(SwapControlsContext);
  if (!canSwap(branchId)) return null;

  return (
    <TouchableBox
      onPress={() => onSwap(branchId)}
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
      <AppIcon icon={IconSwitchHorizontal} size={24} color={colors.darkGrey2} />
    </TouchableBox>
  );
};
