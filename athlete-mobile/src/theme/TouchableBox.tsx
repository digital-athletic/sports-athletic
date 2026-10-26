import {
  backgroundColor,
  BackgroundColorProps,
  border,
  BorderProps,
  createRestyleComponent,
  layout,
  LayoutProps,
  shadow,
  ShadowProps,
  spacing,
  SpacingProps,
} from "@shopify/restyle";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import { Theme } from "./theme";

type RestyleProps = BackgroundColorProps<Theme> &
  BorderProps<Theme> &
  LayoutProps<Theme> &
  ShadowProps<Theme> &
  SpacingProps<Theme>;

export const TouchableBox = createRestyleComponent<
  TouchableOpacityProps & RestyleProps,
  Theme
>([backgroundColor, border, layout, shadow, spacing], TouchableOpacity);
