import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps, FC } from "react";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface IoniconProps {
  name: IoniconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

/**
 * Ionicons Wrapper
 */
export const Ionicon: FC<IoniconProps> = ({
  name,
  size,
  color,
  accessibilityLabel,
}) => {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel || name}
    />
  );
};
