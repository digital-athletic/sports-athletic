// app/form/SelectionInputField.tsx
import { AwesomeIcon, FontAwesomeIconName } from "@/common/AwesomeIcon";
import { Ionicon, IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
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
  iconName?: IoniconName;
  awesomeIconName?: FontAwesomeIconName;
  items: Item[];
  selectedItems: string[];
};

export const SelectionInputField: FC<Props> = ({
  awesomeIconName,
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
      <TouchableOpacity onPress={() => toggleModal(true)} style={{ flex: 1 }}>
        <Box
          flexDirection="row"
          alignItems="center"
          // padding="m"
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
              <Ionicon name={iconName} size={24} color={colors.lightGrey3} />
            </Box>
          )}
          {awesomeIconName && (
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
              <AwesomeIcon
                name={awesomeIconName}
                size={24}
                color={colors.lightGrey3}
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
