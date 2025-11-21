import {
  backgroundColor,
  BackgroundColorProps,
  composeRestyleFunctions,
  layout,
  LayoutProps,
  spacing,
  SpacingProps,
  useRestyle,
} from "@shopify/restyle";
import { FC } from "react";
import { ScrollView, ScrollViewProps } from "react-native";
import { Theme } from "./theme";

type RestyleProps = BackgroundColorProps<Theme> &
  SpacingProps<Theme> &
  LayoutProps<Theme>;

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
  spacing,
  layout,
  backgroundColor,
]);

export const ScrollBox: FC<ScrollViewProps & RestyleProps> = (props) => {
  const stylingProps = useRestyle(restyleFunctions, props);

  return <ScrollView {...stylingProps} {...props} />;
};
