// app/components/SelectionModal.tsx
import { Ionicon } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, TouchableOpacity } from "react-native";

type SelectionItem = {
  value: string;
  displayName: string;
};

type Props = {
  items: SelectionItem[];
  selectedItems: string[];
  single?: boolean;
  visible: boolean;
  onConfirm: (selected: string[]) => void;
  onCancel: () => void;
  selectText?: string;
  confirmText?: string;
};

export const SelectionModal: FC<Props> = ({
  items,
  selectedItems: initialSelected,
  single = false,
  visible,
  onConfirm,
  onCancel,
  selectText,
  confirmText,
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>(initialSelected);

  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected, visible]);

  const toggleItem = (value: string) => {
    if (single) {
      setSelected([value]);
    } else {
      setSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    }
  };

  const handleConfirm = () => {
    onConfirm(selected);
  };

  const handleCancel = () => {
    setSelected(initialSelected);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Box
        position="absolute"
        backgroundColor="black"
        opacity={0.5}
        top={0}
        bottom={0}
        left={0}
        right={0}
      />
      <Box flex={1} justifyContent="center" padding="l">
        <Box
          backgroundColor="white"
          borderRadius="l"
          maxHeight={600}
          overflow="hidden"
        >
          {/* Header */}
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            padding="m"
            borderBottomWidth={1}
            borderBottomColor="lightGrey2"
          >
            <Text variant="sectionTitle">
              {selectText || t("common.choose")}
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicon name="close" size={24} color="black" />
            </TouchableOpacity>
          </Box>

          {/* Item List */}
          <FlatList
            data={items}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isSelected = selected.includes(item.value);
              return (
                <TouchableOpacity onPress={() => toggleItem(item.value)}>
                  <Box
                    padding="m"
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    borderBottomWidth={1}
                    borderBottomColor="lightGrey1"
                  >
                    <Text
                      variant="body"
                      color={isSelected ? "primary" : "darkGrey3"}
                    >
                      {item.displayName}
                    </Text>
                    {isSelected && (
                      <Ionicon name="checkmark" size={24} color="primary" />
                    )}
                  </Box>
                </TouchableOpacity>
              );
            }}
          />

          {/* Confirm Button */}
          <Box padding="m">
            <TouchableOpacity onPress={handleConfirm}>
              <Box
                backgroundColor="primary"
                padding="m"
                borderRadius="m"
                alignItems="center"
              >
                <Text variant="button" color="white">
                  {confirmText || t("common.ok")}
                </Text>
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};
