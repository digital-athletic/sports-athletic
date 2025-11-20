import {
  createRestyleComponent,
  createVariant,
  spacing,
  SpacingProps,
  VariantProps,
} from "@shopify/restyle";
import { FC, PropsWithChildren } from "react";
import { Pressable, PressableProps } from "react-native";
import { Text } from "./Text";
import { Theme } from "./theme";

const ButtonContainer = createRestyleComponent<
  VariantProps<Theme, "buttonVariants"> &
    SpacingProps<Theme> &
    React.ComponentProps<typeof Pressable>,
  Theme
>([createVariant({ themeKey: "buttonVariants" }), spacing], Pressable);

export type ButtonProps = PropsWithChildren<{
  variant?: "primary" | "secondary" | "success" | "quickAction";
}> &
  SpacingProps<Theme> &
  Omit<PressableProps, "children">;

/**
 * Button Component
 *
 * A themed button component using Restyle variants.
 * Supports primary, secondary, success, and quickAction variants.
 *
 * @example
 * <Button>Primary Action</Button>
 * <Button variant="secondary">Secondary Action</Button>
 * <Button variant="success">Success Action</Button>
 * <Button variant="quickAction">Quick</Button>
 */
export const Button: FC<ButtonProps> = ({
  children,
  variant = "primary",
  ...props
}) => {
  const textVariant = variant === "secondary" ? "buttonSecondary" : "button";

  return (
    <ButtonContainer variant={variant} role="button" {...props}>
      <Text variant={textVariant} textAlign="center">
        {children}
      </Text>
    </ButtonContainer>
  );
};
