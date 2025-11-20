import { Box } from "@/theme/Box";
import { type FC } from "react";

type Props = Record<string, never>;

/**
 * Visual divider component for use in lists.
 * Renders a thin horizontal line with spacing.
 */
export const ListDivider: FC<Props> = () => {
  return (
    <Box flexDirection="row">
      <Box flex={1} />
      <Box
        flex={5}
        height={1}
        borderTopWidth={0.5}
        borderTopColor={"lightGrey2"}
      />
    </Box>
  );
};

export default ListDivider;
