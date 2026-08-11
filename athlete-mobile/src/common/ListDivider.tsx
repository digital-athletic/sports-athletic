import { Box } from "@/theme/Box";
import { type FC } from "react";

type Props = {
  /**
   * Rows with a leading icon (the default) offset the line past the icon
   * column with a proportional spacer. Set to false for icon-less rows so
   * the line starts at the same left inset as the row's own text.
   */
  hasLeadingIcon?: boolean;
};

/**
 * Visual divider component for use in lists.
 * Renders a thin horizontal line with spacing.
 */
export const ListDivider: FC<Props> = ({ hasLeadingIcon = true }) => {
  if (!hasLeadingIcon) {
    return (
      <Box paddingLeft="l">
        <Box height={1} borderTopWidth={0.5} borderTopColor="lightGrey2" />
      </Box>
    );
  }

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
