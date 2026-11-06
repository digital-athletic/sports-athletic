import { type FC, type PropsWithChildren } from "react";
import { Keyboard, Platform, Pressable } from "react-native";

/**
 * Closes the on-screen keyboard on a tap next to a text field.
 * On web it renders only the children. A click into a text field would also
 * fire onPress and Keyboard.dismiss would remove the focus from the field.
 */
export const KeyboardDismissArea: FC<PropsWithChildren> = ({ children }) =>
  Platform.OS === "web" ? (
    children
  ) : (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      {children}
    </Pressable>
  );
