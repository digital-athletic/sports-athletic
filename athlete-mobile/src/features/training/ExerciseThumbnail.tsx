import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { type ValueKind } from "@/features/training/hooks/useTrainingListRows";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { Image } from "expo-image";
import { type FC } from "react";

const VALUE_ICONS: Record<ValueKind, IoniconName> = {
  weight: "barbell-outline",
  time: "timer-outline",
  reps: "repeat-outline",
};

type Props = {
  pictureUrl: string | null;
  /** Picks the placeholder icon; without it the placeholder stays empty. */
  valueKind?: ValueKind | null;
  size: number;
  /** Cuts a circle; otherwise the corners use the small radius. */
  round?: boolean;
  /** The placeholder gets the suffix "-placeholder". */
  testID: string;
};

/** Decorative exercise picture; a neutral box stands in when there is no URL. */
export const ExerciseThumbnail: FC<Props> = ({
  pictureUrl,
  valueKind = null,
  size,
  round = false,
  testID,
}) => {
  const { borderRadii, colors } = useTheme();
  const borderRadius = round ? size / 2 : borderRadii.s;
  const hiddenFromScreenReaders = {
    accessibilityElementsHidden: true,
    importantForAccessibility: "no-hide-descendants",
  } as const;

  if (!pictureUrl) {
    return (
      <Box
        width={size}
        height={size}
        backgroundColor="lightGrey2"
        style={{ borderRadius }}
        alignItems="center"
        justifyContent="center"
        testID={`${testID}-placeholder`}
        {...hiddenFromScreenReaders}
      >
        {valueKind && (
          <Ionicon
            name={VALUE_ICONS[valueKind]}
            size={size * 0.4}
            color={colors.lightGrey3}
            decorative
          />
        )}
      </Box>
    );
  }

  return (
    <Image
      source={{ uri: pictureUrl }}
      cachePolicy="disk"
      style={{ width: size, height: size, borderRadius }}
      testID={testID}
      {...hiddenFromScreenReaders}
    />
  );
};
