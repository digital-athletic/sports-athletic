/** A node of the JSON tree that `toJSON()` returns after a render. */
export type RenderedNode = {
  props: Record<string, unknown>;
  children: (RenderedNode | string)[] | null;
};

const childNodes = (node: RenderedNode): RenderedNode[] =>
  (node.children ?? []).filter(
    (child): child is RenderedNode => typeof child !== "string",
  );

/** Every prop name in the rendered tree: ["testID", "points", "translateX"] */
export const collectPropNames = (
  node: RenderedNode | RenderedNode[] | null,
): string[] => {
  if (node === null) return [];
  if (Array.isArray(node)) return node.flatMap(collectPropNames);
  return [
    ...Object.keys(node.props),
    ...childNodes(node).flatMap(collectPropNames),
  ];
};

/** Every text in the rendered tree: ["Mobility", "30%"] */
export const collectTexts = (
  node: RenderedNode | RenderedNode[] | null,
): string[] => {
  if (node === null) return [];
  if (Array.isArray(node)) return node.flatMap(collectTexts);
  // react-native-svg renders text natively as a "content" prop, not as a string child.
  const ownText =
    typeof node.props.content === "string" ? [node.props.content] : [];
  return [
    ...ownText,
    ...(node.children ?? []).flatMap((child) =>
      typeof child === "string" ? [child] : collectTexts(child),
    ),
  ];
};
