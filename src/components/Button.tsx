import {
  createRestyleComponent,
  createVariant,
  spacing,
  SpacingProps,
  VariantProps,
} from "@shopify/restyle";
import { FC, PropsWithChildren } from "react";
import { Pressable, PressableProps } from "react-native";
import { Theme } from "../theme";
import { Text } from "./Text";

const ButtonContainer = createRestyleComponent<
  VariantProps<Theme, "buttonVariants"> &
    SpacingProps<Theme> &
    React.ComponentProps<typeof Pressable>,
  Theme
>([createVariant({ themeKey: "buttonVariants" }), spacing], Pressable);

type ButtonProps = PropsWithChildren<{
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
    <ButtonContainer variant={variant} {...props}>
      <Text variant={textVariant} textAlign="center">
        {children}
      </Text>
    </ButtonContainer>
  );
};
