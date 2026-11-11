import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { type RowWeight } from "@/features/training/hooks/useTrainingListRows";
import { useTheme } from "@/theme/theme";
import { Host, RNHostView, Row, Text } from "@expo/ui";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconRepeat from "@tabler/icons-react-native/IconRepeat";
import IconWeight from "@tabler/icons-react-native/IconWeight";

const ICON_SIZE = 18;

type StatTileProps = {
  icon: AppIconSource;
  value: string;
  caption: string;
  testID: string;
};

const StatTile: FC<StatTileProps> = ({ icon, value, caption, testID }) => {
  const { colors } = useTheme();

  return (
    <Row
      alignment="center"
      spacing={6}
      testID={testID}
      style={{
        backgroundColor: colors.lightGrey2,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <RNHostView matchContents>
        <AppIcon
          icon={icon}
          size={ICON_SIZE}
          color={colors.primary}
          decorative
        />
      </RNHostView>
      <Text
        textStyle={{ fontSize: 18, fontWeight: "600", color: colors.darkGrey3 }}
      >
        {value}
      </Text>
      <Text textStyle={{ fontSize: 14, color: colors.darkGrey1 }}>
        {caption}
      </Text>
    </Row>
  );
};

type Props = {
  targetReps?: number;
  targetWeight?: RowWeight;
};

/** Native reps and weight tiles for the exercise sheet; renders nothing without either. */
export const TrainingExerciseStats: FC<Props> = ({
  targetReps,
  targetWeight,
}) => {
  const { t } = useTranslation();

  if (targetReps === undefined && !targetWeight) return null;

  return (
    <Host matchContents style={{ alignSelf: "center" }}>
      <Row spacing={8} alignment="center">
        {targetReps !== undefined && (
          <StatTile
            icon={IconRepeat}
            value={String(targetReps)}
            caption={t("training.active.repetitions")}
            testID="training-list-sheet-reps"
          />
        )}
        {targetWeight && (
          <StatTile
            icon={IconWeight}
            value={`${targetWeight.isPerHand ? t("training.active.2x") : ""}${targetWeight.kilos.toFixed(2)}`}
            caption={t("training.list.weightUnit")}
            testID="training-list-sheet-weight"
          />
        )}
      </Row>
    </Host>
  );
};
