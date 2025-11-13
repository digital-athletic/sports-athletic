import { createText } from "@shopify/restyle";
import { Theme } from "../theme";

/**
 * Text Component
 *
 * A themed text component with access to predefined text variants.
 * Use variants for consistent typography throughout the app.
 *
 * @example
 * <Text variant="title">Page Title</Text>
 * <Text variant="body">Body text content</Text>
 * <Text variant="description">Supporting description</Text>
 */
export const Text = createText<Theme>();
