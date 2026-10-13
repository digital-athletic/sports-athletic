import { useAgeGroup } from "@/features/anamnesis/useAgeGroup";
import { ListItem } from "@/features/more/ListItem";
import { canTakeStrengthTest } from "@/features/training/utils/strengthTestUtils";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

/** Starting a strength test and entering its results; athletes under 16 get neither. */
export const StrengthTestMenuItems: FC = () => {
  const { t } = useTranslation();
  if (!canTakeStrengthTest(useAgeGroup())) return null;

  return (
    <>
      <ListItem
        title={t("more.startNewTestWorkout")}
        navPath="/training/muscle-soreness"
        navParams={{
          type: "TEST_WORKOUT",
          originPath: "/(tabs)/(more)/more",
        }}
        iconName="barbell"
        iconBackground="primary"
      />
      <ListItem
        title={t("more.enterTestManually")}
        navPath="/training/manual-strength-test"
        iconName="create"
        iconBackground="primary"
      />
    </>
  );
};
