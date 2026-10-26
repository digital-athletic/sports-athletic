import * as v from "valibot";

import { ShareSchema } from "./strengthTestTemplate.schema";

/**
 * The share of the last estimated 1RM a strength test set loads, per fitness
 * level.
 */
export const OneRepMaxSharesSchema = v.strictObject({
  beginner: ShareSchema,
  advanced: ShareSchema,
  professional: ShareSchema,
});
export type OneRepMaxShares = v.InferOutput<typeof OneRepMaxSharesSchema>;
