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

export function thumbnailFills(regionId: string): unknown[] {
  return regionFillsByTestID(`silhouette-thumbnail-region-${regionId}`);
}

/**
 * Fills for a testID that sits on each `<Path>` rather than on a `<G>`
 * container (the read-only BodySilhouette branch), which is also
 * `aria-hidden` and therefore requires `includeHiddenElements`.
 */
export function regionFillsByTestID(testID: string): unknown[] {
  return screen
    .getAllByTestId(testID, { includeHiddenElements: true })
    .map((node: RenderedNode) => node.props.fill);
}

/**
 * The distinct fill values under a per-path testID, so a whole region can be
 * asserted with a single `toEqual([EXPECTED_FILL])`.
 */
export function distinctFills(testID: string): unknown[] {
  const unique = new Set(
    regionFillsByTestID(testID).map((fill) => JSON.stringify(fill)),
  );
  return [...unique].map((fill) => JSON.parse(fill) as unknown);
}

/** Fill props as they appear on host nodes (processColor payload objects). */
export const SELECTED_FILL = {
  type: 0,
  payload: processColor(theme.colors.primary),
};
export const UNSELECTED_FILL = { type: 0, payload: processColor("#7c7c7c") };
export const SECONDARY_FILL = {
  type: 0,
  payload: processColor(theme.colors.primaryMuted),
};
