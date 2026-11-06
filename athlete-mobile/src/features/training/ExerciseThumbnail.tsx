import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { type ValueKind } from "@/features/training/hooks/useTrainingListRows";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { Image } from "expo-image";
import { type FC, useState } from "react";

const VALUE_ICONS: Record<ValueKind, IoniconName> = {
  weight: "barbell-outline",
  time: "timer-outline",
  reps: "repeat-outline",
};

const HIDDEN_FROM_SCREEN_READERS = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

type Props = {
  pictureUrl: string | null;
  /** Picks the placeholder icon; null leaves the placeholder empty. */
  valueKind: ValueKind | null;
  size: number;
  /** Cuts a circle; otherwise the corners use the small radius. */
  round?: boolean;
  /** The placeholder gets the suffix "-placeholder". */
  testID: string;
};

/**
 * Decorative exercise picture drawn over a neutral placeholder box. The box
 * shows while the picture loads and whenever loading fails for any reason,
 * e.g. a missing file, a refused request, or offline without a cached copy.
 */
export const ExerciseThumbnail: FC<Props> = ({
  pictureUrl,
  valueKind,
  size,
  round = false,
  testID,
}) => {
  const { borderRadii, colors } = useTheme();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const borderRadius = round ? size / 2 : borderRadii.s;

  return (
    <Box
      width={size}
      height={size}
      backgroundColor="lightGrey2"
      style={{ borderRadius }}
      alignItems="center"
      justifyContent="center"
      testID={`${testID}-placeholder`}
      {...HIDDEN_FROM_SCREEN_READERS}
    >
      {valueKind && (
        <Ionicon
          name={VALUE_ICONS[valueKind]}
          size={size * 0.4}
          color={colors.lightGrey3}
          decorative
        />
      )}
      {pictureUrl && pictureUrl !== failedUrl && (
        <Image
          source={{ uri: pictureUrl }}
          cachePolicy="disk"
          onError={() => setFailedUrl(pictureUrl)}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius,
          }}
          testID={testID}
          {...HIDDEN_FROM_SCREEN_READERS}
        />
      )}
    </Box>
  );
};
