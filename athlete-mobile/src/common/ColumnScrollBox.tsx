import { useContentColumnStyle } from "@/common/ContentColumn";
import { ScrollBox } from "@/theme/ScrollBox";
import { type ComponentProps, type FC } from "react";

/** ScrollBox whose content is centered and capped like a ContentColumn. */
export const ColumnScrollBox: FC<ComponentProps<typeof ScrollBox>> = ({
  contentContainerStyle,
  ...props
}) => {
  const columnStyle = useContentColumnStyle();

  return (
    <ScrollBox
      contentContainerStyle={[contentContainerStyle, columnStyle]}
      {...props}
    />
  );
};
