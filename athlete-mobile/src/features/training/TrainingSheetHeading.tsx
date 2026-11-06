import { HeaderIconButton } from "@/common/HeaderIconButton";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { secondsToMMSS } from "@/utils/date";
import { type FC, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

export type PauseControl = { isPaused: boolean; onToggle: () => void };
type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  seconds: number;
  isTimed: boolean;
  timerTestID: string;
  pause?: PauseControl;
}>;

// alignSelf keeps the stretched column from widening the tap area.
const PauseToggle: FC<PauseControl> = ({ isPaused, onToggle }) => {
  const { t } = useTranslation();

  return (
    <Box alignSelf="center">
      <HeaderIconButton
        iconName={isPaused ? "play-circle-outline" : "pause-circle-outline"}
        onPress={onToggle}
        accessibilityLabel={
          isPaused
            ? t("training.list.timer.resume")
            : t("training.list.timer.hold")
        }
        testID="training-list-sheet-pause"
      />
    </Box>
  );
};

// An open-ended exercise's stopwatch is secondary info, so it stays small.
// Children render between the subtitle and the timer.
export const TrainingSheetHeading: FC<Props> = ({
  title,
  subtitle,
  seconds,
  isTimed,
  timerTestID,
  pause,
  children,
}) => (
  <>
    <Box>
      <Text variant="title" textAlign="center">
        {title}
      </Text>
      {subtitle && (
        <Text variant="small" color="darkGrey1" textAlign="center">
          {subtitle}
        </Text>
      )}
    </Box>
    {children}
    <Text
      fontSize={isTimed ? 32 : 16}
      fontWeight="300"
      color={isTimed ? "darkGrey3" : "darkGrey2"}
      textAlign="center"
      testID={timerTestID}
    >
      {secondsToMMSS(seconds)}
    </Text>
    {pause && <PauseToggle {...pause} />}
  </>
);
