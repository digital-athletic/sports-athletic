import { Ionicon } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableWithoutFeedback } from "react-native";
import { MuscleType } from "./types";

type BodyPartsTagChipsProps = {
  tags: MuscleType[];
  onClick?: (tag: MuscleType) => void;
};

export const BodyPartsTagChips: FC<BodyPartsTagChipsProps> = ({
  tags,
  onClick,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const renderTag = (tag: MuscleType) => (
    <TouchableWithoutFeedback
      key={`tag_${tag}`}
      onPress={() => onClick?.(tag)}
      disabled={!onClick}
    >
      <Box
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="l"
        paddingVertical="s"
        marginRight="s"
        marginBottom="s"
        borderRadius="l"
        backgroundColor="lightGrey2"
      >
        <Box>
          <Text variant="body">{t(`muscles.${tag}`)}</Text>
        </Box>
        {onClick && (
          <Box
            marginLeft="l"
            justifyContent="center"
            alignItems="center"
            width={24}
            height={24}
          >
            <Ionicon
              name="close-circle"
              size={20}
              color={theme.colors.darkGrey1}
            />
          </Box>
        )}
      </Box>
    </TouchableWithoutFeedback>
  );

  return tags.length > 0 ? (
    <Box
      flexDirection="row"
      flexWrap="wrap"
      paddingVertical="l"
      paddingHorizontal="l"
    >
      {tags.map(renderTag)}
    </Box>
  ) : null;
};
