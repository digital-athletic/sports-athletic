import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useResponsiveProp } from "@shopify/restyle";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  TouchableOpacity,
  type ImageSourcePropType,
} from "react-native";
import { SpeechBubble } from "./SpeechBubble";

export type FullScreenCoachingProps = {
  text: string;
  trainerSource: ImageSourcePropType;
  goOnText: string;
  goOnFunction: () => void;
  skipText?: string;
  skipFunction?: () => void;
};

/**
 * Full-screen coaching component with trainer image and speech bubble.
 * Displays motivational messages with optional skip functionality.
 */
export const FullScreenCoaching: FC<FullScreenCoachingProps> = ({
  text,
  trainerSource,
  goOnText,
  goOnFunction,
  skipText,
  skipFunction,
}) => {
  const { t } = useTranslation();

  const speechFlex = useResponsiveProp({
    phone: 2,
    tablet: 2,
    desktop: 3,
  });

  const trainerImageWidth = useResponsiveProp({
    phone: "100%",
    tablet: 270,
    desktop: 270,
  });

  const hasSkip = !!skipText && typeof skipFunction === "function";

  return (
    <Box flex={1} flexDirection="column">
      {/* Content Section */}
      <Box
        flex={5}
        justifyContent="flex-start"
        alignItems="stretch"
        paddingHorizontal="l"
      >
        {/* Speech Bubble */}
        <Box flex={speechFlex} justifyContent="flex-end" alignItems="center">
          <SpeechBubble text={text} centered />
        </Box>

        {/* Trainer Image */}
        <Box
          flex={2}
          justifyContent="flex-start"
          alignItems="center"
          paddingTop="l"
        >
          <Image
            source={trainerSource}
            resizeMode="contain"
            style={{
              width: trainerImageWidth,
              aspectRatio: 1,
            }}
            accessibilityLabel={t("common.altText.coachFace")}
          />
        </Box>
      </Box>

      {/* Buttons Section */}
      <Box
        flex={1}
        width="100%"
        justifyContent="flex-end"
        alignItems="stretch"
        paddingHorizontal="l"
        paddingBottom="l"
      >
        <Button onPress={goOnFunction}>{goOnText}</Button>

        {hasSkip && (
          <Box marginTop="m">
            <TouchableOpacity
              onPress={skipFunction}
              accessibilityRole="button"
              accessibilityLabel={skipText}
            >
              <Text
                variant="body"
                color="darkGrey3"
                textAlign="center"
                textDecorationLine="underline"
              >
                {skipText}
              </Text>
            </TouchableOpacity>
          </Box>
        )}
      </Box>
    </Box>
  );
};
