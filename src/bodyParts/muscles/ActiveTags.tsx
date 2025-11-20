import { createKey } from "@/bodyParts/helpers";
import { type BodyPartData } from "@/bodyParts/types";
import { Box } from "@/theme/Box";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet } from "react-native";

const SECONDARY_MUSCLE_OPACITY = 0.4;

export type ActiveTagsProps = {
  tags: string[];
  secondaryTags: string[];
  width: number;
  height: number;
  availableTags: BodyPartData[];
};

export const ActiveTags: FC<ActiveTagsProps> = ({
  tags,
  secondaryTags,
  width,
  height,
  availableTags,
}) => {
  const { t } = useTranslation();

  const renderPart = (bodyPart: BodyPartData) => {
    const key = createKey(bodyPart);

    return (
      <Box key={key}>
        {tags.indexOf(bodyPart.name) > -1 && (
          <Image
            key={`image_${key}`}
            style={[
              StyleSheet.absoluteFill,
              {
                width,
                height,
              },
            ]}
            source={bodyPart.image}
            accessibilityLabel={t("common.altText.primaryMuscle", {
              muscleName: bodyPart.name,
            })}
          />
        )}
        {secondaryTags.indexOf(bodyPart.name) > -1 && (
          <Image
            key={`secondary_image_${key}`}
            style={[
              StyleSheet.absoluteFill,
              {
                width,
                height,
                opacity: SECONDARY_MUSCLE_OPACITY,
              },
            ]}
            source={bodyPart.secondaryImage}
            accessibilityLabel={t("common.altText.secondaryMuscle", {
              muscleName: bodyPart.name,
            })}
          />
        )}
      </Box>
    );
  };

  return (
    <Box width={width} height={height} style={StyleSheet.absoluteFill}>
      <Box style={StyleSheet.absoluteFill}>{availableTags.map(renderPart)}</Box>
    </Box>
  );
};
