import { type Side } from "@/bodyParts/types";
import { femaleBack } from "./paths/femaleBack";
import { femaleFront } from "./paths/femaleFront";
import { maleBack } from "./paths/maleBack";
import { maleFront } from "./paths/maleFront";
import { type SilhouetteData, type SilhouetteGender } from "./types";

/** Unselected fills mirror the CC0 assets' greys (`.st1` body, `.st0` muscles). */
export const BODY_FILL = "#c9c9c9";
export const MUSCLE_FILL = "#7c7c7c";

export const SILHOUETTES: Record<
  SilhouetteGender,
  Record<Side, SilhouetteData>
> = {
  MALE: { FRONT: maleFront, BACK: maleBack },
  FEMALE: { FRONT: femaleFront, BACK: femaleBack },
};

export type ViewBoxParts = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

export function parseViewBox(viewBox: string): ViewBoxParts {
  const [minX, minY, width, height] = viewBox.split(" ").map(Number);
  return { minX, minY, width, height };
}
