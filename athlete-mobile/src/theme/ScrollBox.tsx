import {
  backgroundColor,
  BackgroundColorProps,
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
import { ScrollView, ScrollViewProps } from "react-native";
import { Theme } from "./theme";

type RestyleProps = BackgroundColorProps<Theme> &
  LayoutProps<Theme> &
  ShadowProps<Theme> &
  SpacingProps<Theme>;

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
  backgroundColor,
  layout,
  shadow,
  spacing,
]);

// useRestyle already merges the passed style after the theme style.
export const ScrollBox: FC<ScrollViewProps & RestyleProps> = (props) => {
  const stylingProps = useRestyle(restyleFunctions, props);

  return <ScrollView {...stylingProps} />;
};
