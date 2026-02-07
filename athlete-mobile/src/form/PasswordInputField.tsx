import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicon } from "../common/Ionicon";
import { BasicTextInput } from "./BasicTextInput";

interface PasswordInputFieldProps {
  password: string;
  showError?: boolean;
  onChange: (value: string) => void;
  onSubmitEditing?: () => void;
}

const HEIGHT = 56;

/**
 * Password input field with visibility toggle
 */
export const PasswordInputField: FC<PasswordInputFieldProps> = ({
  password,
  showError,
  onChange,
  onSubmitEditing,
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
      height={HEIGHT}
      borderWidth={showError ? 1 : 0}
      borderColor={showError ? "error" : undefined}
    >
      <Box
        width={HEIGHT}
        height={HEIGHT}
        justifyContent="center"
        alignItems="center"
        backgroundColor="lightGrey1"
        borderTopLeftRadius="m"
        borderBottomLeftRadius="m"
        borderLeftWidth={showError ? 1 : 0}
        borderTopWidth={showError ? 1 : 0}
        borderBottomWidth={showError ? 1 : 0}
        borderColor={showError ? "error" : undefined}
      >
        <Ionicon name="lock-closed" size={24} color={colors.lightGrey3} />
      </Box>
      <BasicTextInput
        onChangeText={onChange}
        placeholder={t("common.password")}
        keyboardType="default"
        value={password}
        secureTextEntry={!showPw}
        onSubmitEditing={onSubmitEditing}
        style={{ height: HEIGHT }}
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
