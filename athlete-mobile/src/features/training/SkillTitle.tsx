import { Text } from "@/theme/Text";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type SkillTitleProps = {
  skill: string;
  testID?: string;
};

/** Heading of the exercises of one skill; an unknown skill shows its code. */
export const SkillTitle: FC<SkillTitleProps> = ({ skill, testID }) => {
  const { t } = useTranslation();

  return (
    <Text
      variant="sectionTitle"
      marginBottom="m"
      accessibilityRole="header"
      testID={testID}
    >
      {t(`training.skill.${skill}`, { defaultValue: skill })}
    </Text>
  );
};
