import { type Side } from "@/bodyParts/types";
import { useTheme } from "@/theme/theme";
import { memo } from "react";
import { View } from "react-native";
import { Path, Svg } from "react-native-svg";
import {
  BODY_FILL,
  MUSCLE_FILL,
  parseViewBox,
  SILHOUETTES,
} from "./silhouetteData";
import { type SilhouetteGender, type SilhouetteRegionId } from "./types";

export type SilhouetteThumbnailProps = {
  gender: SilhouetteGender;
  side: Side;
  regions: readonly SilhouetteRegionId[];
  centerY: number;
  size: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Whitespace between the tile slot edge and the artwork, as a fraction of the
 * tile size per side. Layout padding, not viewBox padding: the body artwork is
 * continuous above and below the crop window, so a larger window would show
 * more body instead of whitespace.
 */
export const THUMBNAIL_INSET = 0.1;

/**
 * Crops the asset's own viewBox to a square window of width `W` (the asset
 * width), vertically centered on `centerY` (a fraction of `H`) and clamped so
 * the window never runs past the asset's top or bottom edge.
 */
function cropViewBox(viewBox: string, centerY: number): string {
  const { minX, minY, width, height } = parseViewBox(viewBox);
  const top = clamp(centerY * height - width / 2, 0, height - width);
  return `${minX} ${minY + top} ${width} ${width}`;
}

/**
 * Non-interactive silhouette crop highlighting a fixed set of regions.
 * Sized by explicit width/height, never an aspectRatio wrapper (computes to
 * zero width under react-native-web, per MuscleSilhouette's JSDoc).
 *
 * Memoized: callers must pass a stable `regions` array reference (e.g. a
 * module-level constant) so this does not re-render on every parent render.
 */
export const SilhouetteThumbnail = memo(function SilhouetteThumbnail({
  gender,
  side,
  regions,
  centerY,
  size,
}: SilhouetteThumbnailProps) {
  const theme = useTheme();
  const data = SILHOUETTES[gender][side];
  const artworkSize = size * (1 - 2 * THUMBNAIL_INSET);

  return (
    <View
      aria-hidden
      pointerEvents="none"
      style={{ width: size, height: size, padding: size * THUMBNAIL_INSET }}
      testID="silhouette-thumbnail-wrapper"
    >
      <Svg
        viewBox={cropViewBox(data.viewBox, centerY)}
        width={artworkSize}
        height={artworkSize}
        testID="silhouette-thumbnail"
      >
        {data.bodyPaths.map((d, index) => (
          <Path key={`body-${index}`} d={d} fill={BODY_FILL} />
        ))}
        {data.regions.map((region) =>
          region.paths.map((d, index) => (
            <Path
              key={`${region.id}-${index}`}
              d={d}
              fill={
                regions.includes(region.id) ? theme.colors.primary : MUSCLE_FILL
              }
              testID={`silhouette-thumbnail-region-${region.id}`}
            />
          )),
        )}
      </Svg>
    </View>
  );
});
