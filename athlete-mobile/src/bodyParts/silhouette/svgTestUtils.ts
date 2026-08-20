import { theme } from "@/theme/theme";
import { screen } from "@/utils/testUtils";
import { processColor } from "react-native";

type RenderedNode = { type: unknown; props: Record<string, unknown> };

/** Host `RNSVGPath` nodes rendered inside the element with the given testID. */
export function regionPathHosts(testID: string): RenderedNode[] {
  return screen
    .getByTestId(testID)
    .findAll((node: RenderedNode) => node.type === "RNSVGPath");
}

export function regionFills(testID: string): unknown[] {
  return regionPathHosts(testID).map((node) => node.props.fill);
}

/**
 * Fill props of every `RNSVGPath` tagged with a thumbnail region testID.
 * The thumbnail wrapper is `aria-hidden`, so RNTL hides the whole subtree
 * from queries unless `includeHiddenElements` is set.
 */
export function thumbnailFills(regionId: string): unknown[] {
  return screen
    .getAllByTestId(`silhouette-thumbnail-region-${regionId}`, {
      includeHiddenElements: true,
    })
    .map((node: RenderedNode) => node.props.fill);
}

/** Fill props as they appear on host nodes (processColor payload objects). */
export const SELECTED_FILL = {
  type: 0,
  payload: processColor(theme.colors.primary),
};
export const UNSELECTED_FILL = { type: 0, payload: processColor("#7c7c7c") };
