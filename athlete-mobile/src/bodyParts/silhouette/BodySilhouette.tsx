import { type Side } from "@/bodyParts/types";
import { type ThemeColor, useTheme } from "@/theme/theme";
import { type FC, memo } from "react";
import { View } from "react-native";
import { G, Path, Svg } from "react-native-svg";
import { BODY_FILL, MUSCLE_FILL, SILHOUETTES } from "./silhouetteData";
import {
  type SilhouetteGender,
  type SilhouetteRegion,
  type SilhouetteRegionId,
} from "./types";

type SilhouetteHighlight = {
  regions: readonly SilhouetteRegionId[];
  /** A theme color key, resolved via useTheme() inside the component. */
  color: ThemeColor;
};

type Interactive = {
  onRegionPress: (region: SilhouetteRegionId) => void;
  getRegionLabel: (region: SilhouetteRegionId, highlighted: boolean) => string;
};
type NonInteractive = { onRegionPress?: never; getRegionLabel?: never };

/**
 * Deliberately narrower than the layout `DimensionValue`: `Svg` accepts only
 * `string | number`, so admitting "auto", null or Animated values would need
 * a lossy runtime fallback.
 */
type SilhouetteSize = number | `${number}%`;

type BodySilhouetteProps = {
  gender: SilhouetteGender;
  side: Side;
  /** Ordered; the first group containing a region wins, so callers pass primary first. */
  highlights: readonly SilhouetteHighlight[];
  width: SilhouetteSize;
  height: SilhouetteSize;
  /** Svg-level testID. */
  testID: string;
  /** Prefix for per-region testIDs; must be unique per mounted instance. */
  regionTestIDPrefix: string;
} & (Interactive | NonInteractive);

function isInteractive(
  props: BodySilhouetteProps,
): props is BodySilhouetteProps & Interactive {
  return props.onRegionPress !== undefined;
}

/** The first highlight group containing `regionId` supplies its color; this is the single implementation of "primary wins overlap". */
function resolveHighlightColor(
  highlights: readonly SilhouetteHighlight[],
  regionId: SilhouetteRegionId,
): ThemeColor | undefined {
  return highlights.find((highlight) => highlight.regions.includes(regionId))
    ?.color;
}

function BodyOutline({ paths }: { paths: readonly string[] }) {
  return (
    <>
      {paths.map((d, index) => (
        <Path key={`body-${index}`} d={d} fill={BODY_FILL} />
      ))}
    </>
  );
}

type RegionLayerProps = {
  regions: readonly SilhouetteRegion[];
  highlights: readonly SilhouetteHighlight[];
  regionTestIDPrefix: string;
};

/**
 * Interactive region layer. `role`/`aria-checked` reach only the web DOM
 * (react-native-svg drops them natively). The role must not be "button":
 * react-native-web swaps those to real `<button>` tags, which are invalid
 * (invisible) inside `<svg>`.
 */
const InteractiveRegions: FC<RegionLayerProps & Interactive> = ({
  regions,
  highlights,
  regionTestIDPrefix,
  onRegionPress,
  getRegionLabel,
}) => {
  const theme = useTheme();
  return (
    <>
      {regions.map((region) => {
        const color = resolveHighlightColor(highlights, region.id);
        const highlighted = color !== undefined;
        return (
          <G
            key={region.id}
            accessible
            accessibilityLabel={getRegionLabel(region.id, highlighted)}
            role="checkbox"
            aria-checked={highlighted}
            testID={`${regionTestIDPrefix}${region.id}`}
            onPress={() => onRegionPress(region.id)}
          >
            {region.paths.map((d, index) => (
              <Path
                key={`${region.id}-${index}`}
                d={d}
                fill={color ? theme.colors[color] : MUSCLE_FILL}
              />
            ))}
          </G>
        );
      })}
    </>
  );
};

/**
 * Read-only region layer: no `<G>` wrapper, no roles, no labels. Each `<Path>`
 * still carries the region testID (SilhouetteThumbnail.tsx precedent) so
 * per-region fills stay queryable without a container element.
 */
const NonInteractiveRegions: FC<RegionLayerProps> = ({
  regions,
  highlights,
  regionTestIDPrefix,
}) => {
  const theme = useTheme();
  return (
    <>
      {regions.map((region) => {
        const color = resolveHighlightColor(highlights, region.id);
        return region.paths.map((d, index) => (
          <Path
            key={`${region.id}-${index}`}
            d={d}
            fill={color ? theme.colors[color] : MUSCLE_FILL}
            testID={`${regionTestIDPrefix}${region.id}`}
          />
        ));
      })}
    </>
  );
};

/**
 * Reusable base silhouette renderer: gender + side artwork, ordered highlight
 * groups, optional interactivity. Sized by explicit numeric or percentage
 * width/height; never wrap in an aspectRatio container — that computes to
 * zero width under react-native-web.
 *
 * Memoized: callers must pass stable prop references for this to pay off.
 */
export const BodySilhouette = memo(function BodySilhouette(
  props: BodySilhouetteProps,
) {
  const {
    gender,
    side,
    highlights,
    width,
    height,
    testID,
    regionTestIDPrefix,
  } = props;
  const data = SILHOUETTES[gender][side];
  const readOnlyViewProps = isInteractive(props)
    ? undefined
    : ({ "aria-hidden": true, pointerEvents: "none" } as const);

  return (
    <View style={{ width, height }} {...readOnlyViewProps}>
      <Svg viewBox={data.viewBox} width={width} height={height} testID={testID}>
        <BodyOutline paths={data.bodyPaths} />
        {isInteractive(props) ? (
          <InteractiveRegions
            regions={data.regions}
            highlights={highlights}
            regionTestIDPrefix={regionTestIDPrefix}
            onRegionPress={props.onRegionPress}
            getRegionLabel={props.getRegionLabel}
          />
        ) : (
          <NonInteractiveRegions
            regions={data.regions}
            highlights={highlights}
            regionTestIDPrefix={regionTestIDPrefix}
          />
        )}
      </Svg>
    </View>
  );
});
