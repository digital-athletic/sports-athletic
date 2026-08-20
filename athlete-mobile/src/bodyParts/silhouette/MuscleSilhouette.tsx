import { type Side } from "@/bodyParts/types";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { View } from "react-native";
import { G, Path, Svg } from "react-native-svg";
import { femaleBack } from "./paths/femaleBack";
import { femaleFront } from "./paths/femaleFront";
import { maleBack } from "./paths/maleBack";
import { maleFront } from "./paths/maleFront";
import {
  type SilhouetteData,
  type SilhouetteGender,
  type SilhouetteRegionId,
} from "./types";

/** Unselected fills mirror the CC0 assets' greys (`.st1` body, `.st0` muscles). */
const BODY_FILL = "#c9c9c9";
const MUSCLE_FILL = "#7c7c7c";

const SILHOUETTES: Record<SilhouetteGender, Record<Side, SilhouetteData>> = {
  MALE: { FRONT: maleFront, BACK: maleBack },
  FEMALE: { FRONT: femaleFront, BACK: femaleBack },
};

type MuscleSilhouetteProps = {
  gender: SilhouetteGender;
  side: Side;
  selectedRegions: SilhouetteRegionId[];
  onRegionPress?: (region: SilhouetteRegionId) => void;
  getRegionLabel: (region: SilhouetteRegionId, selected: boolean) => string;
};

/**
 * Touchable body silhouette rendered from extracted SVG path data. Purely
 * presentational and sized by its parent: the artwork keeps its aspect ratio
 * via viewBox scaling. Do not wrap it in a CSS/Yoga aspectRatio container —
 * that computes to zero width under react-native-web.
 *
 * `role`/`aria-checked` reach only the web DOM (react-native-svg drops them
 * natively; callers fold selection into the native label). The role must not
 * be "button": react-native-web swaps those to real `<button>` tags, which
 * are invalid (invisible) inside `<svg>`.
 */
export const MuscleSilhouette: FC<MuscleSilhouetteProps> = ({
  gender,
  side,
  selectedRegions,
  onRegionPress,
  getRegionLabel,
}) => {
  const theme = useTheme();
  const data = SILHOUETTES[gender][side];

  return (
    <View style={{ flex: 1, alignSelf: "stretch" }}>
      <Svg
        viewBox={data.viewBox}
        width="100%"
        height="100%"
        testID="muscle-silhouette"
      >
        {/* BODY outline first (bottom layer); no onPress, so it never takes taps. */}
        {data.bodyPaths.map((d, index) => (
          <Path key={`body-${index}`} d={d} fill={BODY_FILL} />
        ))}
        {data.regions.map((region) => {
          const selected = selectedRegions.includes(region.id);
          return (
            <G
              key={region.id}
              accessible
              accessibilityLabel={getRegionLabel(region.id, selected)}
              role="checkbox"
              aria-checked={selected}
              testID={`silhouette-region-${region.id}`}
              onPress={() => onRegionPress?.(region.id)}
            >
              {region.paths.map((d, index) => (
                <Path
                  key={`${region.id}-${index}`}
                  d={d}
                  fill={selected ? theme.colors.primary : MUSCLE_FILL}
                />
              ))}
            </G>
          );
        })}
      </Svg>
    </View>
  );
};
