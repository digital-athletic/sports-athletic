import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { type FC, type PropsWithChildren } from "react";

type FieldShellProps = PropsWithChildren<{
  icon?: AppIconSource;
  focused?: boolean;
}>;

/** Rounded frame with a leading icon that all input fields share. */
export const FieldShell: FC<FieldShellProps> = ({
  icon,
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
      paddingLeft={icon ? "m" : "none"}
    >
      {icon && (
        <AppIcon
          icon={icon}
          size={22}
          color={focused ? colors.primary : colors.darkGrey1}
          decorative
        />
      )}
      {children}
    </Box>
  );
};
