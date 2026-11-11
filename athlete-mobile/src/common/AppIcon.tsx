import type { Icon as TablerIcon } from "@tabler/icons-react-native";
import type { FC } from "react";
import { View } from "react-native";
import { Ionicon, type IoniconName } from "./Ionicon";

/**
 * A Tabler icon component or an Ionicons name. Import each Tabler icon from its
 * own entry point (`@tabler/icons-react-native/IconBarbell`), so the bundle
 * contains only the icons in use.
 */
export type AppIconSource = TablerIcon | IoniconName;

interface AppIconProps {
  icon: AppIconSource;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  /** Hides the icon from screen readers. Use for icons next to text. */
  decorative?: boolean;
}

/** Renders a Tabler icon or an Ionicons icon with the same props. */
export const AppIcon: FC<AppIconProps> = ({
  icon,
  size,
  color,
  accessibilityLabel,
  decorative = false,
}) => {
  if (typeof icon === "string") {
    return (
      <Ionicon
        name={icon}
        size={size}
        color={color}
        accessibilityLabel={accessibilityLabel}
        decorative={decorative}
      />
    );
  }

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
