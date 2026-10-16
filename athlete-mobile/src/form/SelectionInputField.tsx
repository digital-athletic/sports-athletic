// app/form/SelectionInputField.tsx
import { Ionicon, type IoniconName } from "@/common/Ionicon";
import type { LocalizedDisplayName } from "@/common/types/LocalizedDisplayName";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { SelectionModal } from "./SelectionModal";

type Item = {
  value: string;
  displayName: LocalizedDisplayName;
};

type Props = {
  singleSelection?: boolean;
  onChange: (selectedItems: string[]) => void;
  onToggle?: (opened: boolean) => void;
  iconName?: IoniconName;
  items: readonly Item[];
  selectedItems: string[];
};

export const SelectionInputField: FC<Props> = ({
  iconName,
  singleSelection = false,
  onChange,
  onToggle,
  items,
  selectedItems,
}) => {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const { colors } = useTheme();

  const mappedItems = items.map((item) => ({
    value: item.value,
    displayName: item.displayName[i18n.language] ?? item.displayName.default,
  }));

  const toggleModal = (visible: boolean) => {
    setModalVisible(visible);
    onToggle?.(visible);
  };

  const handleConfirm = (selected: string[]) => {
    onChange(selected);
    toggleModal(false);
  };

  const selectText =
    selectedItems.length === 0
      ? t("common.choose")
      : singleSelection
        ? (items.find((item) => item.value === selectedItems[0])?.displayName[
            i18n.language
          ] ??
          (items.find((item) => item.value === selectedItems[0])?.displayName
            .default ||
            selectedItems[0]))
        : t("common.selected", { count: selectedItems.length });

  return (
    <Box>
      <TouchableOpacity onPress={() => toggleModal(true)} style={{ flex: 1 }}>
        <Box
          flexDirection="row"
          alignItems="center"
          borderRadius="m"
          borderWidth={1}
          borderColor="lightGrey2"
          backgroundColor="white"
          minHeight={52}
        >
          {iconName && (
            <Box
              width={40}
              height="100%"
              justifyContent="center"
              alignItems="center"
              backgroundColor="lightGrey1"
              borderTopLeftRadius="m"
              borderBottomLeftRadius="m"
              marginRight="s"
            >
              <Ionicon
                name={iconName}
                size={24}
                color={colors.lightGrey3}
                decorative
              />
            </Box>
          )}
          <Box flex={1} justifyContent="center">
            <Text variant="body" color="darkGrey3">
              {selectText}
            </Text>
          </Box>
        </Box>
      </TouchableOpacity>

      <SelectionModal
        items={mappedItems}
        selectedItems={selectedItems}
        single={singleSelection}
        visible={modalVisible}
        onConfirm={handleConfirm}
        onCancel={() => toggleModal(false)}
        selectText={t("common.choose")}
        confirmText={t("common.ok")}
      />
    </Box>
  );
};
