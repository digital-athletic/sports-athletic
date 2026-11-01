import { Text } from "@/theme/Text";
import { secondsToMMSS } from "@/utils/date";
import { type FC } from "react";

type Props = {
  title: string;
  seconds: number;
  isTimed: boolean;
  timerTestID: string;
};

// An open-ended exercise's stopwatch is secondary info, so it stays small.
export const TrainingSheetHeading: FC<Props> = ({
  title,
  seconds,
  isTimed,
  timerTestID,
}) => (
  <>
    <Text variant="title" textAlign="center">
      {title}
    </Text>
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
