import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { TileCard } from "@/common/TileCard";
import { TileIcon } from "@/common/TileIcon";
import { type CustomWorkoutFocus } from "@/features/customWorkouts/customWorkoutFocus";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { router } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconBarbell from "@tabler/icons-react-native/IconBarbell";
import IconBolt from "@tabler/icons-react-native/IconBolt";
import IconRefresh from "@tabler/icons-react-native/IconRefresh";
import IconRun from "@tabler/icons-react-native/IconRun";
import IconShieldHeart from "@tabler/icons-react-native/IconShieldHeart";
import IconStretching from "@tabler/icons-react-native/IconStretching";
import IconTrash from "@tabler/icons-react-native/IconTrash";
import IconYoga from "@tabler/icons-react-native/IconYoga";

const ACTION_BUTTON_SIZE = 36;
const ACTION_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

const FOCUS_ICONS: Record<CustomWorkoutFocus, AppIconSource> = {
  strength: IconBarbell,
  explosive: IconBolt,
  cardio: IconRun,
  mobility: IconStretching,
  stability: IconYoga,
  prevention: IconShieldHeart,
};

type CustomWorkoutTileProps = {
  workoutId: string;
  name: string;
  focus: CustomWorkoutFocus;
  /** Marks the tile as "Draft". A screen reader reads the mark after the name. */
  isDraft?: boolean;
  /** Without it the tile has no delete button. */
  deleteAction?: { label: string; onDelete: () => void };
  /** Without it the tile has no refresh button. */
  refreshAction?: { label: string; onRefresh: () => void };
};

/** A short mark in the top left corner of a tile, e.g. "Draft". */
const TileBadge: FC<{ label: string }> = ({ label }) => (
  <Box
    position="absolute"
    top={0}
    left={0}
    margin="xs"
    paddingHorizontal="s"
    paddingVertical="xs"
    borderRadius="s"
    backgroundColor="surfaceContainerLowest"
    pointerEvents="none"
  >
    <Text
      variant="body"
      fontSize={12}
      fontWeight="700"
      color="onSurfaceVariant"
    >
      {label}
    </Text>
  </Box>
);

/** A round icon button in the top right corner of a tile. */
const TileActionButton: FC<{
  icon: AppIconSource;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableBox
      onPress={onPress}
      width={ACTION_BUTTON_SIZE}
      height={ACTION_BUTTON_SIZE}
      borderRadius="round"
      backgroundColor="surfaceContainerLowest"
      alignItems="center"
      justifyContent="center"
      hitSlop={ACTION_HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AppIcon
        icon={icon}
        size={20}
        color={colors.onSurfaceVariant}
        decorative
      />
    </TouchableBox>
  );
};

/**
 * Tile of a custom training in a tile grid. A tap opens the muscle soreness
 * step of the training. The refresh and delete buttons are siblings of the
 * card, so a tap on them leaves the training closed.
 */
export const CustomWorkoutTile: FC<CustomWorkoutTileProps> = ({
  workoutId,
  name,
  focus,
  isDraft,
  deleteAction,
  refreshAction,
}) => {
  const { t } = useTranslation();
  const draftLabel = t("screens.home.additionalTrainings.draft");
  const openWorkout = () =>
    router.navigate({
      pathname: "/training/muscle-soreness",
      params: { type: workoutId },
    });

  return (
    <Box>
      <TileCard
        title={name}
        accessibilityLabel={isDraft ? `${name}, ${draftLabel}` : undefined}
        onPress={openWorkout}
      >
        <TileIcon
          icon={FOCUS_ICONS[focus]}
          testID={`custom-workout-icon-${focus}`}
        />
      </TileCard>
      {isDraft && <TileBadge label={draftLabel} />}
      <Box
        position="absolute"
        top={0}
        right={0}
        margin="xs"
        flexDirection="row"
        gap="xs"
      >
        {refreshAction && (
          <TileActionButton
            icon={IconRefresh}
            label={refreshAction.label}
            onPress={refreshAction.onRefresh}
          />
        )}
        {deleteAction && (
          <TileActionButton
            icon={IconTrash}
            label={deleteAction.label}
            onPress={deleteAction.onDelete}
          />
        )}
      </Box>
    </Box>
  );
};
