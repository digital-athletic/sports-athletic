import { createKey, linkDataToStyle } from "@/bodyParts/helpers";
import { MuscleType, type BodyPartData } from "@/bodyParts/types";
import { Box } from "@/theme/Box";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableWithoutFeedback } from "react-native";

export type TagLinksProps = {
  onMuscleLinkClick: (muscleName: MuscleType) => void;
  width: number;
  height: number;
  availableTags: BodyPartData[];
};

export const TagLinks: FC<TagLinksProps> = ({
  onMuscleLinkClick,
  width,
  height,
  availableTags,
}) => {
  const { t } = useTranslation();

  const renderPart = (bodyPart: BodyPartData) => {
    const styleObject = linkDataToStyle(bodyPart, width, height);
    const key = createKey(bodyPart);
    const { name } = bodyPart;

    const handlePress = () => {
      onMuscleLinkClick(name);
    };

    return (
      <TouchableWithoutFeedback
        key={`link_${key}`}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={t("common.altText.muscleLink", {
          muscleName: name,
        })}
      >
        <Box style={styleObject} />
      </TouchableWithoutFeedback>
    );
  };

  return (
    <Box style={StyleSheet.absoluteFill}>{availableTags.map(renderPart)}</Box>
  );
};
