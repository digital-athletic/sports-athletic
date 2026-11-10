import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { type FC, type PropsWithChildren } from "react";

type FieldShellProps = PropsWithChildren<{
  iconName?: IoniconName;
  focused?: boolean;
}>;

/** Rounded frame with a leading icon that all input fields share. */
export const FieldShell: FC<FieldShellProps> = ({
  iconName,
  focused = false,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      backgroundColor="white"
      borderRadius="xl"
      borderWidth={1.5}
      borderColor={focused ? "primary" : "lightGrey2"}
      minHeight={56}
      paddingLeft={iconName ? "m" : "none"}
    >
      {iconName && (
        <Ionicon
          name={iconName}
          size={22}
          color={focused ? colors.primary : colors.darkGrey1}
          decorative
        />
      )}
      {children}
    </Box>
  );
};
