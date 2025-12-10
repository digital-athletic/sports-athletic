import { useResponsiveProp } from "@shopify/restyle";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "react-native";
import { Box } from "../theme/Box";
import { SpeechBubble } from "./SpeechBubble";

export type CoachingProps = {
  text: string;
};

export const Coaching: FC<CoachingProps> = ({ text }) => {
  const { t } = useTranslation();
  const minHeight = useResponsiveProp({ phone: 80, tablet: 125 });

  return (
    <Box
      flex={1}
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      minHeight={minHeight}
    >
      <Box
        flex={1}
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="stretch"
      >
        <Image
          source={require("../../assets/img/coach/face.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
          accessibilityLabel={t("common.altText.coachFace")}
        />
      </Box>
      <Box flex={3} paddingLeft="l">
        <SpeechBubble text={text} centered={false} />
      </Box>
    </Box>
  );
};
