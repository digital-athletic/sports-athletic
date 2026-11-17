import { MenuView } from "@expo/ui/community/menu";
import IconChevronDown from "@tabler/icons-react-native/IconChevronDown";
import { type FC } from "react";
import { StyleSheet, View } from "react-native";
import { AppIcon } from "@/common/AppIcon";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";

export type SelectOption = { value: string; label: string };

export type SelectMenuProps = {
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Names the choice for screen readers; the trigger reads the current label as its value. */
  accessibilityLabel: string;
};

/**
 * Single choice as a compact pill that shows the current option. A tap opens
 * the native menu: a pull-down menu on iOS, a dropdown on Android.
 */
export const SelectMenu: FC<SelectMenuProps> = ({
  options,
  value,
  onChange,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();
  const currentLabel =
    options.find((option) => option.value === value)?.label ?? "";

  // The menu identifies an action by its position, because a value may be empty.
  const actions = options.map((option, index) => ({
    id: String(index),
    title: option.label,
    state: option.value === value ? ("on" as const) : ("off" as const),
  }));

  return (
    <MenuView
      actions={actions}
      onPressAction={({ nativeEvent }) => {
        const option = options[Number(nativeEvent.event)];
        if (option) onChange(option.value);
      }}
      style={styles.menu}
    >
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: currentLabel }}
        style={[
          styles.trigger,
          { backgroundColor: colors.white, borderColor: colors.lightGrey2 },
        ]}
      >
        <Text variant="small" fontWeight="600" color="darkGrey3">
          {currentLabel}
        </Text>
        <AppIcon
          icon={IconChevronDown}
          size={16}
          color={colors.darkGrey3}
          decorative
        />
      </View>
    </MenuView>
  );
};

const styles = StyleSheet.create({
  menu: { alignSelf: "flex-start" },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1.5,
  },
});
