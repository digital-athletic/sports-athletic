import type { Icon as TablerIcon } from "@tabler/icons-react-native";
import type { FC } from "react";
import { View } from "react-native";

/**
 * A Tabler icon component. Import each icon from its own entry point
 * (`@tabler/icons-react-native/IconBarbell`), so the bundle contains only the
 * icons in use.
 */
export type AppIconSource = TablerIcon;

interface AppIconProps {
  icon: AppIconSource;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  /** Hides the icon from screen readers. Use for icons next to text. */
  decorative?: boolean;
}

/** Renders a Tabler icon. */
export const AppIcon: FC<AppIconProps> = ({
  icon,
  size,
  color,
  accessibilityLabel,
  decorative = false,
}) => {
  const Icon = icon;

  // On web the SVG hands its props to the DOM, so a wrapping view hides the
  // icon from screen readers instead of the SVG itself.
  if (decorative) {
    return (
      <View
        testID="decorative-icon"
        accessible={false}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      >
        <Icon size={size} color={color} />
      </View>
    );
  }

  return <Icon size={size} color={color} title={accessibilityLabel} />;
};
