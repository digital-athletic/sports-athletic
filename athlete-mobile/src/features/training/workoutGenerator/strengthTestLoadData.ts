import { loadOneRepMaxShares } from "@/data/loadOneRepMaxShares";
import { loadStrengthTest } from "@/data/loadStrengthTest";
import type { StrengthTestLoadData } from "./setListBuilders/strengthTestSetListBuilder";

/** The bundled test set loads and 1RM shares of the strength test. */
export const loadStrengthTestLoadData = (): StrengthTestLoadData => ({
  testSetLoads: loadStrengthTest().testSetLoads,
  oneRepMaxShares: loadOneRepMaxShares(),
});
