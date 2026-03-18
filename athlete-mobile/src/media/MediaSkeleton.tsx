import { type FC } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";

type Props = {
  onRetry?: () => void;
  width?: number;
  height?: number;
  aspectRatio?: number;
  showRetry?: boolean;
};

export const MediaSkeleton: FC<Props> = ({
  onRetry,
  width,
  height,
  aspectRatio = 1,
  showRetry = true,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      width={width}
      height={height}
      aspectRatio={aspectRatio}
      backgroundColor="darkGrey3"
      justifyContent="center"
      alignItems="center"
      borderRadius="m"
    >
      {showRetry && onRetry ? (
        <>
          <Text color="lightGrey3" textAlign="center" marginBottom="s">
            {t("common.videoLoadError")}
          </Text>
          <TouchableOpacity
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={t("common.retry")}
          >
            <Box
              borderRadius="m"
              paddingHorizontal="m"
              paddingVertical="s"
              backgroundColor="primary"
            >
              <Text color="white">{t("common.retry")}</Text>
            </Box>
          </TouchableOpacity>
        </>
      ) : (
        <Text color="lightGrey3" variant="xSmall" textAlign="center">
          {t("common.noConnection")}
        </Text>
      )}
    </Box>
  );
};
