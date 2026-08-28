import { type Side } from "@/bodyParts/types";
import { BodySilhouette } from "@/bodyParts/silhouette/BodySilhouette";
import { resolveExerciseRegions } from "@/bodyParts/silhouette/exerciseMuscleRegions";
import {
  parseViewBox,
  SILHOUETTES,
} from "@/bodyParts/silhouette/silhouetteData";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Box } from "@/theme/Box";
import { useResponsiveProp } from "@shopify/restyle";
import { type FC } from "react";

type ExerciseMuscleSilhouettePairProps = {
  primaryTags: readonly string[];
  secondaryTags: readonly string[];
};

type SideConfig = {
  side: Side;
  testID: string;
  regionTestIDPrefix: string;
};

/** Front left, back right; distinct region testID prefixes because NECK, SHOULDER_* and ADDUCTORS_* render on both sides. */
const SIDES: readonly SideConfig[] = [
  {
    side: "FRONT",
    testID: "exercise-silhouette-front",
    regionTestIDPrefix: "exercise-silhouette-front-region-",
  },
  {
    side: "BACK",
    testID: "exercise-silhouette-back",
    regionTestIDPrefix: "exercise-silhouette-back-region-",
  },
];

/**
 * Non-interactive front+back silhouette pair for the exercise detail screen.
 * `primaryTags`/`secondaryTags` are RAW exercise tags (getTagValues output),
 * not expandMuscleTags output, so SHOULDER/SHOULDER_FRONT/SHOULDER_REAR keep
 * their front/rear distinction.
 */
export const ExerciseMuscleSilhouettePair: FC<
  ExerciseMuscleSilhouettePairProps
> = ({ primaryTags, secondaryTags }) => {
  const gender = useUserProfileStore((state) => state.personalData.gender);
  const silhouetteHeight =
    useResponsiveProp({ phone: 200, tablet: 260 }) ?? 200;

  return (
    <Box
      flexDirection="row"
      justifyContent="center"
      alignItems="flex-end"
      marginBottom="m"
    >
      {SIDES.map(({ side, testID, regionTestIDPrefix }) => {
        const viewBox = parseViewBox(SILHOUETTES[gender][side].viewBox);
        const width = Math.round(
          (silhouetteHeight * viewBox.width) / viewBox.height,
        );

        return (
          <BodySilhouette
            key={side}
            gender={gender}
            side={side}
            highlights={[
              {
                regions: resolveExerciseRegions(primaryTags, side),
                color: "primary",
              },
              {
                regions: resolveExerciseRegions(secondaryTags, side),
                color: "primaryMuted",
              },
            ]}
            width={width}
            height={silhouetteHeight}
            testID={testID}
            regionTestIDPrefix={regionTestIDPrefix}
          />
        );
      })}
    </Box>
  );
};
