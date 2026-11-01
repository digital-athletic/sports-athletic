import { Text } from "@/theme/Text";
import { secondsToMMSS } from "@/utils/date";
import { type FC } from "react";

type Props = {
  title: string;
  subtitle?: string;
  seconds: number;
  isTimed: boolean;
  timerTestID: string;
};

// An open-ended exercise's stopwatch is secondary info, so it stays small.
export const TrainingSheetHeading: FC<Props> = ({
  title,
  subtitle,
  seconds,
  isTimed,
  timerTestID,
}) => (
  <>
    <Text variant="title" textAlign="center">
      {title}
    </Text>
    {subtitle && (
      <Text variant="small" color="darkGrey1" textAlign="center">
        {subtitle}
      </Text>
    )}
    <Text
      fontSize={isTimed ? 32 : 16}
      fontWeight="300"
      color={isTimed ? "darkGrey3" : "darkGrey2"}
      textAlign="center"
      testID={timerTestID}
    >
      {secondsToMMSS(seconds)}
    </Text>
  </>
);
