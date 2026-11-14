import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { useResponsiveProp } from "@shopify/restyle";
import IconStopwatch from "@tabler/icons-react-native/IconStopwatch";
import { AppIcon } from "@/common/AppIcon";
import enTranslations from "@/i18n/locales/en.json";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import {
  type SportTest,
  type SportTestReferenceValue,
} from "./models/SportTest";
import { formatRangeNumber } from "./referenceRange";

type TranslatedTestCode = keyof typeof enTranslations.performanceTests.tests;

type Props = {
  test: SportTest;
  range: SportTestReferenceValue | null;
};

function isTranslatedTestCode(code: string): code is TranslatedTestCode {
  return Object.hasOwn(enTranslations.performanceTests.tests, code);
}

/** One test as a card with its icon, name and the reference range of the athlete. Not pressable. */
export const PerformanceTestRow: FC<Props> = ({ test, range }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const iconCircleSize = useResponsiveProp({ phone: 36, tablet: 52 });
  const iconSize = useResponsiveProp({ phone: 20, tablet: 28 });

  const name = isTranslatedTestCode(test.code)
    ? t(`performanceTests.tests.${test.code}`)
    : test.code;
  const reference = range
    ? t("more.performanceTests.reference", {
        start: formatRangeNumber(range.rangeStart, i18n.language),
        end: formatRangeNumber(range.rangeEnd, i18n.language),
        unit: test.unit,
      })
    : t("more.performanceTests.noReference");

  return (
    <Card
      variant="outlined"
      backgroundColor="lightGrey1"
      flexDirection="row"
      alignItems="center"
      gap={{ phone: "s", tablet: "m" }}
      padding={{ phone: "s", tablet: "m" }}
      testID={`performance-test-row-${test.code}`}
      accessible
      accessibilityLabel={`${name}, ${reference}`}
    >
      <Box
        width={iconCircleSize}
        height={iconCircleSize}
        borderRadius="round"
        backgroundColor="primaryTint"
        alignItems="center"
        justifyContent="center"
      >
        <AppIcon
          icon={IconStopwatch}
          size={iconSize}
          color={colors.primary}
          decorative
        />
      </Box>
      <Box flex={1}>
        <Text
          variant="body"
          fontSize={{ phone: 16, tablet: 20 }}
          fontWeight="600"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          variant="small"
          fontSize={{ phone: 14, tablet: 17 }}
          color="darkGrey1"
        >
          {reference}
        </Text>
      </Box>
    </Card>
  );
};
