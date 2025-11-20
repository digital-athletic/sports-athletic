import { BodyPartsTagChips } from "@/bodyParts/BodyPartsTagChips";
import { ActiveTags } from "@/bodyParts/muscles/ActiveTags";
import { TagLinks } from "@/bodyParts/muscles/TagLinks";
import { Coaching } from "@/common/Coaching";
import { Box } from "@/theme/Box";
import { useCallback, useEffect, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { muscleMBack } from "./data/muscle_m_back";
import { muscleMFront, muscleMFrontSoreness } from "./data/muscle_m_front";
import { muscleWBack } from "./data/muscle_w_back";
import { muscleWFront, muscleWFrontSoreness } from "./data/muscle_w_front";
import { painMBack } from "./data/pain_m_back";
import { painWBack } from "./data/pain_w_back";
import {
  BodyPartType,
  Gender,
  MuscleType,
  Side,
  type BodyPartData,
} from "./types";

// Background images

const BACKGROUNDS = {
  MUSCLES: {
    M: {
      FRONT: require("../../assets/img/bodyparts/muscle_m_front/background.png"),
      FRONT_SORENESS: require("../../assets/img/bodyparts/muscle_m_front/background_soreness.png"),
      BACK: require("../../assets/img/bodyparts/muscle_m_back/background.png"),
    },
    W: {
      FRONT: require("../../assets/img/bodyparts/muscle_w_front/background.png"),
      FRONT_SORENESS: require("../../assets/img/bodyparts/muscle_w_front/background_soreness.png"),
      BACK: require("../../assets/img/bodyparts/muscle_w_back/background.png"),
    },
  },
  PAINS: {
    M: require("../../assets/img/bodyparts/pain_m_back/background.png"),
    W: require("../../assets/img/bodyparts/pain_w_back/background.png"),
  },
};

// Muscle data

const MUSCLES = {
  M: {
    FRONT: muscleMFront,
    FRONT_SORENESS: muscleMFrontSoreness,
    BACK: muscleMBack,
  },
  W: {
    FRONT: muscleWFront,
    FRONT_SORENESS: muscleWFrontSoreness,
    BACK: muscleWBack,
  },
};

// Pain data (back only)

const PAINS = {
  M: painMBack,
  W: painWBack,
};

type BodyPartsProps = {
  type: BodyPartType;
  gender: Gender;
  tags: MuscleType[];
  secondaryTags: MuscleType[];
  onChange?: (tags: MuscleType[]) => void;
  showChips: boolean;
  hideCoaching?: boolean;
  side?: Side;
  showsSoreness?: boolean;
};

export const BodyParts: FC<BodyPartsProps> = ({
  type,
  gender,
  tags,
  secondaryTags,
  onChange,
  showChips,
  hideCoaching = false,
  side: propSide,
  showsSoreness = false,
}) => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const aspectRatio = 1.5;
  const height = width * aspectRatio;

  const [side, setSide] = useState<Side>(propSide || "FRONT");
  const [availableTags, setAvailableTags] = useState<BodyPartData[]>(
    MUSCLES.W.FRONT
  );

  // Update available tags based on props
  const updateAvailableTags = useCallback(
    (side: Side, bodyGender: Gender, bodyType: BodyPartType) => {
      let availableTags: BodyPartData[] = MUSCLES.W.FRONT;

      if (bodyType === "MUSCLE") {
        if (side === "FRONT" && showsSoreness) {
          availableTags =
            bodyGender === "w"
              ? MUSCLES.W.FRONT_SORENESS
              : MUSCLES.M.FRONT_SORENESS;
        } else if (side === "FRONT") {
          availableTags =
            bodyGender === "w" ? MUSCLES.W.FRONT : MUSCLES.M.FRONT;
        } else {
          availableTags = bodyGender === "w" ? MUSCLES.W.BACK : MUSCLES.M.BACK;
        }
      } else if (bodyType === "PAIN") {
        availableTags = bodyGender === "w" ? PAINS.W : PAINS.M;
      }

      return availableTags;
    },
    [showsSoreness]
  );

  useEffect(() => {
    const newSide = propSide || "FRONT";
    const newAvailableTags = updateAvailableTags(newSide, gender, type);
    setAvailableTags(newAvailableTags);
  }, [gender, propSide, type, updateAvailableTags]);

  // Handle muscle click
  const handleMuscleLinkClick = (tag: MuscleType) => {
    const updatedTags = [...tags];
    const indexOfTag = updatedTags.indexOf(tag);
    if (indexOfTag > -1) {
      updatedTags.splice(indexOfTag, 1);
    } else {
      updatedTags.push(tag);
    }

    onChange?.(updatedTags);
  };

  // Toggle between front and back
  const toggleSide = () => {
    const newSide = side === "FRONT" ? "BACK" : "FRONT";
    const newAvailableTags = updateAvailableTags(newSide, gender, type);

    setSide(newSide);
    setAvailableTags(newAvailableTags);
  };

  // Get background image
  const getBackgroundImage = () => {
    if (type === "PAIN") {
      return gender === "w" ? BACKGROUNDS.PAINS.W : BACKGROUNDS.PAINS.M;
    }

    if (side === "BACK") {
      return gender === "w"
        ? BACKGROUNDS.MUSCLES.W.BACK
        : BACKGROUNDS.MUSCLES.M.BACK;
    }

    if (showsSoreness) {
      return gender === "w"
        ? BACKGROUNDS.MUSCLES.W.FRONT_SORENESS
        : BACKGROUNDS.MUSCLES.M.FRONT_SORENESS;
    }

    return gender === "w"
      ? BACKGROUNDS.MUSCLES.W.FRONT
      : BACKGROUNDS.MUSCLES.M.FRONT;
  };

  return (
    <Box flex={1}>
      <ScrollView>
        {/* Coaching Section */}
        {!hideCoaching && (
          <Coaching
            text={
              type === "PAIN"
                ? t("common.bodyParts.selectHurtingParts")
                : t("common.bodyParts.whereAreAchingMuscles")
            }
          />
        )}

        {/* Body Display Section */}
        <View style={{ width: "100%", zIndex: 1 }}>
          {/* Rotation Button - only show if side not fixed by props */}
          {!propSide && (
            <TouchableOpacity
              style={{
                position: "absolute",
                height: 56,
                width: 60,
                zIndex: 2,
                top: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={toggleSide}
            >
              <Image
                source={require("../../assets/img/body_rotate.png")}
                style={{ width: 40, height: 40 }}
              />
            </TouchableOpacity>
          )}

          {/* Body Image with Tags */}
          <ImageBackground
            source={getBackgroundImage()}
            style={{
              width,
              height,
              position: "relative",
            }}
            imageStyle={{ resizeMode: "cover" }}
          >
            <ActiveTags
              tags={tags}
              secondaryTags={secondaryTags}
              width={width}
              height={height}
              availableTags={availableTags}
            />
            <TagLinks
              onMuscleLinkClick={handleMuscleLinkClick}
              width={width}
              height={height}
              availableTags={availableTags}
            />
          </ImageBackground>
        </View>

        {/* Tag Chips Section */}
        {tags.length > 0 && showChips && (
          <BodyPartsTagChips tags={tags} onClick={handleMuscleLinkClick} />
        )}
      </ScrollView>
    </Box>
  );
};
