import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicon } from "../common/Ionicon";
import { BasicTextInput } from "./BasicTextInput";

interface PasswordInputFieldProps {
  onChange: (value: string) => void;
  password: string;
  showError?: boolean;
}

/**
 * Password input field with visibility toggle
 */
export const PasswordInputField: FC<PasswordInputFieldProps> = ({
  onChange,
  password,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [showPw, setShowPw] = useState(false);

  const toggleShowPw = () => {
    setShowPw(!showPw);
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      backgroundColor="lightGrey2"
      borderRadius="m"
      height={56}
    >
      <Box
        width={56}
        height={56}
        justifyContent="center"
        alignItems="center"
        backgroundColor="lightGrey1"
        borderTopLeftRadius="m"
        borderBottomLeftRadius="m"
      >
        <Ionicon name="lock-closed" size={24} color={colors.lightGrey3} />
      </Box>
      <BasicTextInput
        onChangeText={onChange}
        placeholder={t("common.password")}
        keyboardType="default"
        value={password}
        secureTextEntry={!showPw}
      />
      <TouchableOpacity
        style={styles.showButton}
        activeOpacity={0.7}
        onPressIn={toggleShowPw}
        onPressOut={toggleShowPw}
      >
        <Ionicon name="eye" size={20} color={colors.lightGrey3} />
      </TouchableOpacity>
    </Box>
  );
};

const styles = StyleSheet.create({
  showButton: {
    paddingHorizontal: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
});
