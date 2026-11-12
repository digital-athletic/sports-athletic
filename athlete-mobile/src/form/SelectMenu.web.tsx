import { type FC } from "react";
import { useTheme } from "@/theme/theme";
import type { SelectMenuProps } from "./SelectMenu";

/** Web single choice as the browser's own select, styled as a compact pill. */
export const SelectMenu: FC<SelectMenuProps> = ({
  options,
  value,
  onChange,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();

  return (
    <select
      aria-label={accessibilityLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        alignSelf: "flex-start",
        minHeight: 34,
        padding: "0 12px",
        borderRadius: 17,
        border: `1.5px solid ${colors.outlineVariant}`,
        backgroundColor: colors.surface,
        color: colors.onSurface,
        // The font stack of react-native-web Text, so the select matches the app text.
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
