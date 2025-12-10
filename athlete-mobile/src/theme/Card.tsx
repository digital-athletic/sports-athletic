import {
  backgroundColor,
  BackgroundColorProps,
  createRestyleComponent,
  createVariant,
  layout,
  LayoutProps,
  spacing,
  SpacingProps,
  VariantProps,
} from "@shopify/restyle";
import { View, ViewProps } from "react-native";
import { Theme } from "./theme";

type RestyleProps = SpacingProps<Theme> &
  BackgroundColorProps<Theme> &
  LayoutProps<Theme> &
  VariantProps<Theme, "cardVariants">;

type CardProps = RestyleProps & ViewProps & { children?: React.ReactNode };

/**
 * Card Component
 *
 * A pre-styled container component for card-based layouts.
 * Includes shadow, rounded corners, and proper padding by default.
 *
 * @example
 * <Card variant="elevated">
 *   <Text variant="cardTitle">Card Title</Text>
 *   <Text variant="cardDescription">Card description</Text>
 * </Card>
 */
export const Card = createRestyleComponent<CardProps, Theme>(
  [
    createVariant({ themeKey: "cardVariants" }),
    spacing,
    backgroundColor,
    layout,
  ],
  View,
);
