import { AppIcon } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { secondsToMMSS } from "@/utils/date";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconPlayerPlayFilled from "@tabler/icons-react-native/IconPlayerPlayFilled";

/** Height of both buttons, the minimum touch target. */
const BUTTON_SIZE = 44;

export type StartExerciseButtonProps = {
  /** True for the one exercise of the checklist whose button is filled. */
  isFeatured: boolean;
  onPress: () => void;
  /** Saved timer value; set when the next set continues where it was left. */
  resumeSeconds?: number;
  testId: string;
};

type ButtonFaceProps = {
  /** Saved timer value as MM:SS, or undefined for a set that starts over. */
  resumeTime: string | undefined;
  testId: string;
};

/** Filled pill: a play icon with the saved time of a paused set, else "Start". */
const FilledFace: FC<ButtonFaceProps> = ({ resumeTime, testId }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Box
      minHeight={BUTTON_SIZE}
      paddingHorizontal="m"
      flexDirection="row"
      alignItems="center"
      gap="xs"
      backgroundColor="primary"
      borderRadius="round"
    >
      <AppIcon
        icon={IconPlayerPlayFilled}
        size={16}
        color={colors.onPrimary}
        decorative
      />
      <Text
        variant="body"
        color="onPrimary"
        fontWeight="600"
        testID={resumeTime ? `${testId}-resume-time` : undefined}
      >
        {resumeTime ?? t("training.list.start")}
      </Text>
    </Box>
  );
};

/** Quiet circle with a play icon; a paused set shows its saved time beside it. */
const QuietFace: FC<ButtonFaceProps> = ({ resumeTime, testId }) => {
  const { colors } = useTheme();

  return (
    <>
      {resumeTime && (
        <Text
          variant="small"
          color="onSurfaceVariant"
          testID={`${testId}-resume-time`}
        >
          {resumeTime}
        </Text>
      )}
      <Box
        width={BUTTON_SIZE}
        height={BUTTON_SIZE}
        justifyContent="center"
        alignItems="center"
        backgroundColor="primaryContainer"
        borderWidth={1.5}
        borderColor="inversePrimary"
        borderRadius="round"
      >
        <AppIcon
          icon={IconPlayerPlayFilled}
          size={18}
          color={colors.primary}
          decorative
        />
      </Box>
    </>
  );
};

const accessibleNameKey = (isFeatured: boolean) =>
  isFeatured
    ? "training.list.startNextExercise"
    : "training.list.startExercise";

/**
 * Opens the exercise sheet for a pending checklist row. The featured exercise
 * shows the filled button, every other open row the quiet one. A paused set
 * shows its saved timer value.
 */
export const StartExerciseButton: FC<StartExerciseButtonProps> = ({
  isFeatured,
  onPress,
  resumeSeconds,
  testId,
}) => {
  const { t } = useTranslation();
  const resumeTime =
    resumeSeconds === undefined ? undefined : secondsToMMSS(resumeSeconds);
  const Face = isFeatured ? FilledFace : QuietFace;

  return (
    <TouchableBox
      onPress={onPress}
      flexDirection="row"
      alignItems="center"
      gap="s"
      accessibilityRole="button"
      accessibilityLabel={
        resumeTime
          ? t("training.list.continueExercise", { time: resumeTime })
          : t(accessibleNameKey(isFeatured))
      }
      testID={testId}
    >
      <Face resumeTime={resumeTime} testId={testId} />
    </TouchableBox>
  );
};
