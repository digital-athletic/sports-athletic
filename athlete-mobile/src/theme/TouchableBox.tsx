import {
  backgroundColor,
  BackgroundColorProps,
  border,
  BorderProps,
  composeRestyleFunctions,
  layout,
  LayoutProps,
  shadow,
  ShadowProps,
  spacing,
  SpacingProps,
  useRestyle,
} from "@shopify/restyle";
import { FC } from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import { Theme } from "./theme";

type RestyleProps = BackgroundColorProps<Theme> &
  BorderProps<Theme> &
  LayoutProps<Theme> &
  ShadowProps<Theme> &
  SpacingProps<Theme>;

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
  backgroundColor,
  border,
  layout,
  shadow,
  spacing,
]);

export const TouchableBox: FC<TouchableOpacityProps & RestyleProps> = (
  props,
) => {
  const stylingProps = useRestyle(restyleFunctions, props);

  return <TouchableOpacity {...stylingProps} {...props} />;
};
