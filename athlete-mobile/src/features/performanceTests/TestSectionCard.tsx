import { type FC, type PropsWithChildren } from "react";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";

/** A bordered card of the detail screen. */
export const TestSectionCard: FC<PropsWithChildren<{ testID?: string }>> = ({
  testID,
  children,
}) => (
  <Card
    variant="outlined"
    backgroundColor="lightGrey1"
    padding={{ phone: "m", tablet: "l" }}
    gap={{ phone: "s", tablet: "m" }}
    testID={testID}
  >
    {children}
  </Card>
);

export const TestSectionTitle: FC<{ title: string }> = ({ title }) => (
  <Text variant="title" fontSize={{ phone: 18, tablet: 24 }}>
    {title}
  </Text>
);
