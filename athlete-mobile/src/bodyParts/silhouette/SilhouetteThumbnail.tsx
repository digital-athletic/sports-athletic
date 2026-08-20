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
 * Whitespace around the artwork, as a fraction of the tile size per side.
 * Must be layout padding, not viewBox padding: the artwork is continuous above
 * and below the crop window, so a larger window shows body, not whitespace.
 */
export const THUMBNAIL_INSET = 0.1;

/** Square crop window of the asset's own width, centered on `centerY` (a fraction of viewBox height). */
function cropViewBox(viewBox: string, centerY: number): string {
  const { minX, minY, width, height } = parseViewBox(viewBox);
  const top = clamp(centerY * height - width / 2, 0, height - width);
  return `${minX} ${minY + top} ${width} ${width}`;
}

/**
 * Non-interactive silhouette crop highlighting a fixed set of regions.
 * Sized by explicit width/height, never an aspectRatio wrapper (that computes
 * to zero width under react-native-web).
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
