import * as v from "valibot";

const formatIssuePath = (
  root: string,
  path: v.IssuePathItem[] | undefined,
): string =>
  (path ?? []).reduce(
    (acc, item) =>
      item.type === "array"
        ? `${acc}[${String(item.key)}]`
        : `${acc}${acc === "" ? "" : "."}${String(item.key)}`,
    root,
  );

// Returns a clone of the source, not the schema output, so the source key order stays.
export const parseData = <T>(
  schema: v.GenericSchema<unknown, T>,
  data: unknown,
  name: string,
  root = "",
): T => {
  const result = v.safeParse(schema, data);
  if (!result.success) {
    console.error(`Validation failed for ${name}:`, v.flatten(result.issues));
    const lines = result.issues.map(
      (issue) => `${formatIssuePath(root, issue.path)}: ${issue.message}`,
    );
    throw new Error(
      [`Invalid data structure for ${name}`, ...lines].join("\n"),
    );
  }
  return structuredClone(data) as T;
};

const deepFreeze = <T>(value: T): T => {
  if (typeof value === "object" && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

// "clone" returns a fresh copy per call, "frozen" the same deep frozen value.
export const createDataLoader = <T>(
  parse: () => T,
  mode: "clone" | "frozen",
): (() => T) => {
  let cached: T | undefined;
  let isCached = false;

  return () => {
    if (!isCached) {
      cached = mode === "frozen" ? deepFreeze(parse()) : parse();
      isCached = true;
    }
    return mode === "frozen" ? (cached as T) : structuredClone(cached as T);
  };
};
