import { Box } from "@/theme/Box";
import { useResponsiveProp } from "@shopify/restyle";
import { type ComponentProps, type FC } from "react";
import { type ViewStyle } from "react-native";

// Android and Material name no number, so forms stay about as wide as on a large phone.
export const CONTENT_MAX_WIDTH = 640;

type ContentColumnStyle = Pick<ViewStyle, "width" | "maxWidth" | "alignSelf">;

/**
 * Centers content and caps its width from the tablet breakpoint on. For a
 * list's contentContainerStyle, where a wrapping ContentColumn does not fit.
 */
export const useContentColumnStyle = (): ContentColumnStyle => {
  const maxWidth = useResponsiveProp({
    phone: undefined,
    tablet: CONTENT_MAX_WIDTH,
  });

  return { width: "100%", maxWidth, alignSelf: "center" };
};

/** Box that centers its content and caps its width from the tablet breakpoint on. */
export const ContentColumn: FC<ComponentProps<typeof Box>> = ({
  style,
  ...props
}) => {
  const columnStyle = useContentColumnStyle();

  return <Box style={[columnStyle, style]} {...props} />;
};
