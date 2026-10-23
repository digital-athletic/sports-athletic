import { Ionicon } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC, type ReactNode } from "react";
import { TouchableOpacity } from "react-native";

export type ColumnListRowProps = {
  /** Already translated. */
  title: string;
  description?: string;
  secondaryDescription?: string;
  thumbnail?: ReactNode;
  onPress: () => void;
};

/** Full width list row with optional thumbnail, shared by ColumnList and the home list screens. */
export const ColumnListRow: FC<ColumnListRowProps> = ({
  title,
  description,
  secondaryDescription,
  thumbnail,
  onPress,
}) => {
  const { colors } = useTheme();
  const hasDescription = description !== undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hasDescription ? `${title}, ${description}` : title}
      activeOpacity={0.7}
    >
      <Box
        position="relative"
        width="100%"
        backgroundColor="white"
        borderBottomWidth={1}
        borderBottomColor="lightGrey2"
        flexDirection="row"
        alignItems="center"
      >
        {thumbnail}
        <Box
          paddingHorizontal="m"
          paddingVertical="m"
          justifyContent="center"
          flex={1}
        >
          <Text
            variant="cardTitle"
            marginBottom={hasDescription ? "xs" : "none"}
          >
            {title}
          </Text>
          {hasDescription && (
            <Box>
              <Text variant="body" color="darkGrey1">
                {description}
              </Text>
              {secondaryDescription && (
                <Text variant="body" color="darkGrey1" marginTop="xs">
                  {secondaryDescription}
                </Text>
              )}
            </Box>
          )}
        </Box>
        <Box paddingRight="m">
          <Ionicon
            name="chevron-forward"
            size={20}
            color={colors.lightGrey3}
            decorative
          />
        </Box>
      </Box>
    </TouchableOpacity>
  );
};
