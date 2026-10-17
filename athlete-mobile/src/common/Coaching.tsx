import { useResponsiveProp } from "@shopify/restyle";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Image, TouchableOpacity } from "react-native";
import { Ionicon } from "./Ionicon";
import { Box } from "../theme/Box";
import { useTheme } from "../theme/theme";
import { SpeechBubble } from "./SpeechBubble";

export type CoachingProps = {
  text: string;
  onDismiss?: () => void;
};

export const Coaching: FC<CoachingProps> = ({ text, onDismiss }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const minHeight = useResponsiveProp({ phone: 80, tablet: 125 });
  const faceSize = useResponsiveProp({ phone: 60, tablet: 100 });

  return (
    <Box
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      minHeight={minHeight}
    >
      <Box
        flex={1}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Image
          source={require("../../assets/img/coach/face.png")}
          style={{ width: faceSize, height: faceSize }}
          resizeMode="contain"
          accessibilityLabel={t("common.altText.coachFace")}
        />
      </Box>
      <Box flex={3} paddingLeft="l">
        <SpeechBubble text={text} centered={false} />
      </Box>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t("common.close")}
          accessibilityRole="button"
        >
          <Box paddingLeft="s">
            <Ionicon
              name="close-circle"
              size={24}
              color={theme.colors.darkGrey1}
              decorative
            />
          </Box>
        </TouchableOpacity>
      )}
    </Box>
  );
};
