// app/form/SelectionInputField.tsx
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { SelectionModal } from "./SelectionModal";

type LocalizedDisplayName = {
  [lang: string]: string;
  default: string;
};

type Item = {
  value: string;
  displayName: LocalizedDisplayName;
};

type Props = {
  singleSelection?: boolean;
  onChange: (selectedItems: string[]) => void;
  onToggle?: (opened: boolean) => void;
  iconName?: string;
  awesomeIconName?: string;
  items: Item[];
  selectedItems: string[];
};

export const SelectionInputField: FC<Props> = ({
  singleSelection = false,
  onChange,
  onToggle,
  items,
  selectedItems,
}) => {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const mappedItems = items.map((item) => ({
    value: item.value,
    displayName: item.displayName[i18n.language] || item.displayName.default,
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
        ? selectedItems[0]
        : t("common.selected", { count: selectedItems.length });

  return (
    <Box>
      <TouchableOpacity onPress={() => toggleModal(true)}>
        <Box
          padding="m"
          borderRadius="m"
          borderWidth={1}
          borderColor="lightGrey2"
          backgroundColor="white"
        >
          <Text variant="body">{selectText}</Text>
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
