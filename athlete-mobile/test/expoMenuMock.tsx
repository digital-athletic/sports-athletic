import type { MenuAction, MenuComponentProps } from "@expo/ui/community/menu";
import { type ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

export type { MenuAction, MenuComponentProps };

/**
 * Stand in for the native menu: the trigger plus one radio per action, so tests
 * can query the actions by role. A menu with one checked action is a single choice.
 */
export const MenuView = ({
  actions,
  onPressAction,
  children,
  testID,
}: MenuComponentProps): ReactElement => (
  <View testID={testID}>
    {children}
    {actions.map((action) => (
      <Pressable
        key={action.id ?? action.title}
        accessibilityRole="radio"
        accessibilityLabel={action.title}
        accessibilityState={{ checked: action.state === "on" }}
        onPress={() =>
          onPressAction?.({ nativeEvent: { event: action.id ?? action.title } })
        }
      >
        <Text>{action.title}</Text>
      </Pressable>
    ))}
  </View>
);

export default MenuView;
