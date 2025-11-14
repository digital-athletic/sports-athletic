import { createBox } from "@shopify/restyle";
import { Theme } from "../theme";

/**
 * Box Component
 *
 * A flexible container component with access to theme spacing, colors, and layout props.
 * Use this as a building block for layouts instead of plain View components.
 *
 * @example
 * <Box padding="l" backgroundColor="white" borderRadius={8}>
 *   <Text>Content</Text>
 * </Box>
 */
export const Box = createBox<Theme>();
