import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { ComponentProps, FC } from "react";

export type FontAwesomeIconName = ComponentProps<typeof FontAwesome>["name"];

interface AwesomeIconProps {
  name: FontAwesomeIconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

/**
 * Font Awesome Icon Wrapper
 *
 * Wrapper component for Font Awesome icons from @expo/vector-icons.
 * Provides a simplified interface for rendering Font Awesome icons.
 *
 * @example
 * ```tsx
 * <AwesomeIcon name="heart" size={24} color="#FF0000" />
 * <AwesomeIcon name="user" size={32} />
 * ```
 */
export const AwesomeIcon: FC<AwesomeIconProps> = ({
  name,
  size,
  color,
  accessibilityLabel,
}) => {
  return (
    <FontAwesome
      name={name}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel || name}
    />
  );
};
