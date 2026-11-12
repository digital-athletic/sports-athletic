import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { TileCard } from "@/common/TileCard";
import { TileIcon } from "@/common/TileIcon";
import { type CustomWorkoutFocus } from "@/features/customWorkouts/customWorkoutFocus";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { router } from "expo-router";
import { type FC } from "react";
import IconBarbell from "@tabler/icons-react-native/IconBarbell";
import IconBolt from "@tabler/icons-react-native/IconBolt";
import IconRun from "@tabler/icons-react-native/IconRun";
import IconShieldHeart from "@tabler/icons-react-native/IconShieldHeart";
import IconStretching from "@tabler/icons-react-native/IconStretching";
import IconTrash from "@tabler/icons-react-native/IconTrash";
import IconYoga from "@tabler/icons-react-native/IconYoga";

const DELETE_BUTTON_SIZE = 36;
const DELETE_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

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
  /** Without it the tile has no delete button. */
  deleteAction?: { label: string; onDelete: () => void };
};

/**
 * Tile of a custom training in a tile grid. A tap opens the muscle soreness
 * step of the training. The delete button is a sibling of the card, so a tap
 * on it leaves the training closed.
 */
export const CustomWorkoutTile: FC<CustomWorkoutTileProps> = ({
  workoutId,
  name,
  focus,
  deleteAction,
}) => {
  const { colors } = useTheme();
  const openWorkout = () =>
    router.navigate({
      pathname: "/training/muscle-soreness",
      params: { type: workoutId },
    });

  return (
    <Box>
      <TileCard title={name} onPress={openWorkout}>
        <TileIcon
          icon={FOCUS_ICONS[focus]}
          testID={`custom-workout-icon-${focus}`}
        />
      </TileCard>
      {deleteAction && (
        <Box position="absolute" top={0} right={0} margin="xs">
          <TouchableBox
            onPress={deleteAction.onDelete}
            width={DELETE_BUTTON_SIZE}
            height={DELETE_BUTTON_SIZE}
            borderRadius="round"
            backgroundColor="white"
            alignItems="center"
            justifyContent="center"
            hitSlop={DELETE_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={deleteAction.label}
          >
            <AppIcon
              icon={IconTrash}
              size={20}
              color={colors.darkGrey1}
              decorative
            />
          </TouchableBox>
        </Box>
      )}
    </Box>
  );
};
