import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps, FC } from "react";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface IoniconProps {
  name: IoniconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  /** Hides the icon from screen readers. Use for icons next to text. */
  decorative?: boolean;
}

/**
 * Ionicons Wrapper
 */
export const Ionicon: FC<IoniconProps> = ({
  name,
  size,
  color,
  accessibilityLabel,
  decorative = false,
}) => {
  if (decorative) {
    return (
      <Ionicons
        name={name}
        size={size}
        color={color}
        accessible={false}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel || name}
    />
  );
};
