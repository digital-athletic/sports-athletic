import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { type ValueKind } from "@/features/training/hooks/useTrainingListRows";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { Image } from "expo-image";
import { type FC, useState } from "react";
import IconRepeat from "@tabler/icons-react-native/IconRepeat";
import IconStopwatch from "@tabler/icons-react-native/IconStopwatch";
import IconWeight from "@tabler/icons-react-native/IconWeight";

const VALUE_ICONS: Record<ValueKind, AppIconSource> = {
  weight: IconWeight,
  time: IconStopwatch,
  reps: IconRepeat,
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
      backgroundColor="surfaceContainerHigh"
      style={{ borderRadius }}
      alignItems="center"
      justifyContent="center"
      testID={`${testID}-placeholder`}
      {...HIDDEN_FROM_SCREEN_READERS}
    >
      {valueKind && (
        <AppIcon
          icon={VALUE_ICONS[valueKind]}
          size={size * 0.4}
          color={colors.outline}
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
