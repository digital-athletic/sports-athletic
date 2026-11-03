import type { GeneratorError } from "@/features/training/models/GeneratorError";

/**
 * Raises the configuration error OTHER/OTHER for an entry the authored data
 * lacks. The params name the missing entry, so a report shows which file to fix.
 *
 * throwConfigurationError("skillTree", "BAS")
 * → throws { type: "OTHER", subtype: "OTHER", params: ["skillTree", "BAS"] }
 */
export const throwConfigurationError = (...params: string[]): never => {
  throw { type: "OTHER", subtype: "OTHER", params } satisfies GeneratorError;
};
