import { type FC } from "react";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import {
  type SportTest,
  type SportTestReferenceValue,
} from "./models/SportTest";
import { TestIconCircle } from "./TestIconCircle";
import { useReferenceLine, useTestName } from "./useTestLabels";

type Props = {
  test: SportTest;
  range: SportTestReferenceValue | null;
};

/** One test as a card with its icon, name and the reference range of the athlete. Not pressable. */
export const PerformanceTestRow: FC<Props> = ({ test, range }) => {
  const name = useTestName(test.code);
  const reference = useReferenceLine(test, range);

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
      <TestIconCircle />
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
