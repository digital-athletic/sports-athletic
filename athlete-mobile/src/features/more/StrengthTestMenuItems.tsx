import { useAgeGroup } from "@/features/anamnesis/useAgeGroup";
import { ListItem } from "@/features/more/ListItem";
import { canTakeStrengthTest } from "@/features/training/utils/strengthTestUtils";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconEdit from "@tabler/icons-react-native/IconEdit";
import IconWeight from "@tabler/icons-react-native/IconWeight";

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
        icon={IconWeight}
        iconBackground="primary"
      />
      <ListItem
        title={t("more.enterTestManually")}
        navPath="/training/manual-strength-test"
        icon={IconEdit}
        iconBackground="primary"
      />
    </>
  );
};
