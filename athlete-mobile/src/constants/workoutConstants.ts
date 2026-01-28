import { I18nKey } from "@/i18n";
import { type LevelTagSchemaType } from "@/schemas/common.schema";
import { Route } from "expo-router";
import { ImageSourcePropType } from "react-native";
import { SharedConstants } from "./sharedConstants";

const AGE_GROUPS = {
  CHILD: "CHILD",
  ADOLESCENT: "ADOLESCENT",
  ADULT: "ADULT",
} as const;

export type AgeGroupTag = (typeof AGE_GROUPS)[keyof typeof AGE_GROUPS];

export const isAgeGroupTag = (value: unknown): value is AgeGroupTag =>
  typeof value === "string" && value in AGE_GROUPS;

const LEVELS = {
  BEGINNER: "BEGINNER",
  ADVANCED: "ADVANCED",
  PROFESSIONAL: "PROFESSIONAL",
} as const;

export type LevelTag = LevelTagSchemaType;

export const isLevelTag = (value: unknown): value is LevelTag =>
  typeof value === "string" && value in LEVELS;

const AGE_GROUPS_MAX_AGE = {
  CHILD: 16,
  ADOLESCENT: 18,
  ADULT: 300, // should match everyone
};

const SKILL_TREES = [
  "BAS",
  "BR",
  "CARDIO_1_SHORT",
  "CARDIO_1_LAKTAT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
  "CD",
  "GKS",
  "GKSKG",
  "MAX",
  "MOB",
  "PLYO",
  "PREV",
  "PREVKG",
  "SA",
  "SASPEZIAL",
  "SK",
  "SKKG",
  "SWR1",
  "SWR1KG",
  "WU",
  "WUSKSA",
  "WUSPEZIAL",
] as const;

export type SkillTree = (typeof SKILL_TREES)[number] | "SUPPORT" | "SAKG";

type SkillTreeHeartRateMap = Partial<
  Record<SkillTree, { low: number; high: number }>
>;

const SKILL_TREE_HEART_RATES: SkillTreeHeartRateMap = {
  CARDIO_1_LAKTAT: { low: 0.8, high: 0.95 },
  CARDIO_3: { low: 0.8, high: 0.95 },
  CARDIO_2: { low: 0.9, high: 1 },
  CARDIO_4: { low: 0.65, high: 0.8 },
  CARDIO_5: { low: 0.55, high: 0.65 },
};
const SKILL_TREE_HEART_RATE_DEFAULT = { low: 1, high: 1 };
const HEART_RATE_MAX = 210;

const SECTION_ORDER = [
  "BR",
  "MOB",
  "WUPREV",
  "WUSPEZIAL",
  "WUSKSA",
  "WU",
  "BAS",
  "GKS",
  //PHASES
  "PHASE",
  "SWR1",
  "SWR1KG",
  "SWR2",
  "SWR2KG",
  "MAX",
  "MAX_KRAFT",
  "SK",
  "SKKG",
  "SA",
  "SAKG",
  "SAS",
  "SASKG",
  //PREVS
  "PREV",
  "PREVKNEE",
  "PREVSHOULDER",
  "PREVWRIST",
  "PREVANKLE",
  "PREVSPINE",
  "CARDIO_1_SHORT",
  "CARDIO_1_LAKTAT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
  "CD",
];

const MUSCLES = [
  "NACKEN_HINTEN",
  "NACKEN_VORNE",
  "NACKEN_SEITE",
  "SCHULTER",
  "SCHULTER_VORNE",
  "SCHULTER_HINTEN",
  "SCHULTER_SEITE",
  "BIZEPS",
  "ARMSTRECKER",
  "HANDGELENKSBEUGER",
  "HANDGELENKSSTRECKER",
  "FINGER_HANDGELENKSMUSKULATUR",
  "BRUST",
  "NACKEN",
  "OBERER_RUECKEN",
  "GROSSER_RUECKENMUSKEL_LAT",
  "SCHULTERBLATT_FIXIEREND_HINTEN",
  "SCHULTERBLATT_FIXIEREND_FRONT",
  "UNTERER_RUECKEN",
  "GERADE_BAUCHMUSKELN",
  "SEITLICHE_BAUCHMUSKELN",
  "HUEFT_BEUGER",
  "HUEFT_INNEN_ROTATOR",
  "HUEFT_AUSSEN_ROTATOR",
  "OBERSCHENKELVORDERSEITE",
  "GESAESS",
  "INNERER_OBERSCHENKEL",
  "AEUSSERER_OBERSCHENKEL",
  "WADE",
  "SPRUNGGELENK",
  "SCHIENBEIN",
];

const BIG_MUSCLES = [
  "BRUST",
  "GROSSER_RUECKENMUSKEL_LAT",
  "GESAESS",
  "INNERER_OBERSCHENKEL",
  "AEUSSERER_OBERSCHENKEL",
];

export type WorkoutRegion = "OBERKOERPER" | "UNTERKOERPER" | "RUMPF";

const EQUIPMENT = {
  DUMBBELL: "DUMBBELL",
  ADJUSTABLE_BENCH: "ADJUSTABLE_BENCH",
  BARBELL_BENCH: "BARBELL_BENCH",
  BARBELL: "BARBELL",
  BARBELL_MULTIPLE: "BARBELL_MULTIPLE",
  KETTLEBELL: "KETTLEBELL",
  KETTLEBELL_MULTIPLE: "KETTLEBELL_MULTIPLE",
  TUBE_MEDIUM: "TUBE_MEDIUM",
  TUBE_MEDIUM_MULTIPLE: "TUBE_MEDIUM_MULTIPLE",
  TUBE_STRONG: "TUBE_STRONG",
  TUBE_STRONG_MULTIPLE: "TUBE_STRONG_MULTIPLE",
  TUBE_EXTREME: "TUBE_EXTREME",
  TUBE_EXTREME_MULTIPLE: "TUBE_EXTREME_MULTIPLE",
  BENCH: "BENCH",
  POWER_RACK: "POWER_RACK",
  TREADMILL: "TREADMILL",
  TRACK_20: "TRACK_20",
  TRACK_LONG: "TRACK_LONG",
  FOAM_BALL: "FOAM_BALL",
  MEDICINE_BALL: "MEDICINE_BALL",
  MEDICINE_BALL_JUMPING: "MEDICINE_BALL_JUMPING",
  HANDBALL: "HANDBALL",
  EXERCISING_BENCH: "EXERCISING_BENCH",
  SLIPPERY_GROUND: "SLIPPERY_GROUND",
  TOWEL: "TOWEL",
  TUBE_WEAK: "TUBE_WEAK",
  TUBE_WEAK_MULTIPLE: "TUBE_WEAK_MULTIPLE",
  BOTTLE: "BOTTLE",
  FOAM_ROLLER: "FOAM_ROLLER",
  CHAIR: "CHAIR",
  PARK_BENCH: "PARK_BENCH",
  BOX_LOW: "BOX_LOW",
  AREA_10: "AREA_10",
  AREA_20: "AREA_20",
  MULTIPLE_EXERCISING_BENCHES: "MULTIPLE_EXERCISING_BENCHES",
  INCLINE_BENCH: "INCLINE_BENCH",
  WALL_BAR: "WALL_BAR",
  HANDBALL_GOAL: "HANDBALL_GOAL",
  WALL: "WALL",
  CROSS_BAR: "CROSS_BAR",
  TRACK_5: "TRACK_5",
  AREA_5: "AREA_5",
  CEILING: "CEILING",
  BOX_HIGH: "BOX_HIGH",
  GYMNASTICS_BOX: "GYMNASTICS_BOX",
  ROPE: "ROPE",
  SPEED_LADDER: "SPEED_LADDER",
  MARKERS: "MARKERS",
  HURDELS: "HURDELS",
  HURDELS_TALL: "HURDELS_TALL",
  MINIBANDS_WEAK: "MINIBANDS_WEAK",
  MINIBANDS_NORMAL: "MINIBANDS_NORMAL",
  MINIBANDS_STRONG: "MINIBANDS_STRONG",
  MINIBANDS_SUPER: "MINIBANDS_SUPER",
  TUBE: "TUBE",
  MINIBAND: "MINIBAND",
  TRACK: "TRACK",
  AREA: "AREA",
} as const;

const DEACTIVATED_EQUIPMENT = [
  "GYMNASTICS_BOX",
  "HURDELS",
  "HURDELS_TALL",
  "KETTLEBELL",
  "KETTLEBELL_MULTIPLE",
  "MINIBANDS_WEAK",
  "MINIBANDS_NORMAL",
  "MINIBANDS_STRONG",
  "MINIBANDS_SUPER",
  "ROPE",
  "TUBE_WEAK",
  "TUBE_MEDIUM",
  "TUBE_STRONG",
  "TUBE_EXTREME",
  "TUBE_WEAK_MULTIPLE",
  "TUBE_MEDIUM_MULTIPLE",
  "TUBE_STRONG_MULTIPLE",
  "TUBE_EXTREME_MULTIPLE",
];

export type CardioTypes =
  | "CARDIO_1"
  | "CARDIO_1_SHORT"
  | "CARDIO_1_LAKTAT"
  | "CARDIO_2"
  | "CARDIO_3"
  | "CARDIO_4"
  | "CARDIO_5";

export type SectionTypes =
  | "SWR1"
  | "SWR1KG"
  | "SWR2"
  | "SWR2KG"
  | "MAX"
  | "MAX_KRAFT"
  | "SK"
  | "SKKG"
  | "SAKG"
  | "SA";

const SKILL_TYPES = {
  SWR1: "SWR1",
  SWR1KG: "SWR1KG",
  SWR2: "SWR2",
  SWR2KG: "SWR2KG",
  MAX_KRAFT: "MAX_KRAFT",
  SK: "SK",
  SKKG: "SKKG",
  SA: "SA",
  SAKG: "SAKG",
  BAS: "BAS",
  BR: "BR",
  CD: "CD",
  GKS: "GKS",
  HBCARDIO: "HBCARDIO",
  MOB: "MOB",
  PREVSHOULDER: "PREVSHOULDER",
  PREVKNEE: "PREVKNEE",
  PREVWRIST: "PREVWRIST",
  PREVANKLE: "PREVANKLE",
  PREVSPINE: "PREVSPINE",
  WU: "WU",
  // Generator-specific skills
  CARDIO_5: "CARDIO_5",
  WUSPEZIAL: "WUSPEZIAL",
} as const;

export const skillTypeValues = Object.values(SKILL_TYPES);

export type SkillTypes = (typeof skillTypeValues)[number];

export const isSkillTypes = (value: unknown): value is SkillTypes =>
  typeof value === "string" && skillTypeValues.includes(value as SkillTypes);

const placeTypeValues = ["HOME", "OUTSIDE", "HALL", "STUDIO"] as const;

export type PlaceType = (typeof placeTypeValues)[number];

export const isPlaceType = (value: unknown): value is PlaceType =>
  typeof value === "string" && placeTypeValues.includes(value as PlaceType);

export type FocusType = "PHASE" | "CARDIO" | "STABILITY" | "COMBINED";

export type TileData = {
  picture: ImageSourcePropType;
  title: I18nKey;
  description?: {
    text: I18nKey;
    params?: {
      time?: number; // in minutes
      place?: string;
      focus?: string;
    };
  };
  navigate: {
    key: Route;
    params?: {
      type: SkillTypes | "PLAN" | "TEST_WORKOUT";
      weekday?: number;
      sectionIndex?: number;
      originPath?: string;
      sectionType?: SectionTypes;
      sectionCardioType?: CardioTypes;
      trainingFocus?: FocusType;
    };
  };
};

export const QUICKSTART_TILES: TileData[] = [
  {
    picture: require("../../assets/img/shortTrainings/beinachsenstabilitaet.jpg"),
    title: "training.quickstart.STABILITY_TILE_BAS",
    description: { text: "training.quickstart.QUICKSTART_BAS_DESC" },
    navigate: { key: "/training/muscle-soreness", params: { type: "BAS" } },
  },
  {
    picture: require("../../assets/img/shortTrainings/ganzkoerperstabilitaet.jpg"),
    title: "training.quickstart.STABILITY_TILE_GKS",
    description: { text: "training.quickstart.QUICKSTART_GKS_DESC" },
    navigate: { key: "/training/muscle-soreness", params: { type: "GKS" } },
  },
  {
    picture: require("../../assets/img/shortTrainings/mobility.jpg"),
    title: "training.quickstart.QUICKSTART_MOBILITY",
    description: { text: "training.quickstart.QUICKSTART_MOBILITY_DESC" },
    navigate: { key: "/training/muscle-soreness", params: { type: "MOB" } },
  },
  {
    picture: require("../../assets/img/shortTrainings/foam_roller.png"),
    title: "training.quickstart.QUICKSTART_FOAM_ROLLER",
    description: { text: "training.quickstart.QUICKSTART_FOAM_ROLLER_DESC" },
    navigate: { key: "/training/muscle-soreness", params: { type: "BR" } },
  },
  {
    picture: require("../../assets/img/shortTrainings/warm_up.jpg"),
    title: "training.quickstart.QUICKSTART_WARM_UP",
    description: { text: "training.quickstart.QUICKSTART_WARM_UP_DESC" },
    navigate: { key: "/training/muscle-soreness", params: { type: "WU" } },
  },
  {
    picture: require("../../assets/img/shortTrainings/cool_down.jpg"),
    title: "training.quickstart.QUICKSTART_COOL_DOWN",
    description: { text: "training.quickstart.QUICKSTART_COOL_DOWN_DESC" },
    navigate: { key: "/training/muscle-soreness", params: { type: "CD" } },
  },
];

export const PREVENTION_TILES: TileData[] = [
  {
    picture: require("../../assets/img/prevention/prevention_ankle_4to3.png"),
    title: "training.prevention.PREVENTION_TILE_ANKLE",
    navigate: {
      key: "/training/muscle-soreness",
      params: { type: "PREVANKLE" },
    },
  },
  {
    picture: require("../../assets/img/prevention/prevention_hip_4to3.png"),
    title: "training.prevention.PREVENTION_TILE_KNEE",
    navigate: {
      key: "/training/muscle-soreness",
      params: { type: "PREVKNEE" },
    },
  },
  {
    picture: require("../../assets/img/prevention/prevention_spine_4to3.png"),
    title: "training.prevention.PREVENTION_TILE_SPINE",
    navigate: {
      key: "/training/muscle-soreness",
      params: { type: "PREVSPINE" },
    },
  },
  {
    picture: require("../../assets/img/prevention/prevention_shoulder_4to3.png"),
    title: "training.prevention.PREVENTION_TILE_SHOULDER",
    navigate: {
      key: "/training/muscle-soreness",
      params: { type: "PREVSHOULDER" },
    },
  },
  {
    picture: require("../../assets/img/prevention/prevention_wrist_4to3.png"),
    title: "training.prevention.PREVENTION_TILE_WRIST",
    navigate: {
      key: "/training/muscle-soreness",
      params: { type: "PREVWRIST" },
    },
  },
];

const VALUE_TYPE_NAMES = [
  "duration",
  "height",
  "repetition",
  "weight",
] as const;

type DurationOption = { value: number; label: number };

const DEFAULT_DURATION_OPTIONS: DurationOption[] = [
  {
    value: 20,
    label: 20,
  },
  {
    value: 25,
    label: 25,
  },
  {
    value: 30,
    label: 30,
  },
  {
    value: 35,
    label: 35,
  },
  {
    value: 40,
    label: 40,
  },
  {
    value: 45,
    label: 45,
  },
  {
    value: 50,
    label: 50,
  },
  {
    value: 55,
    label: 55,
  },
  {
    value: 60,
    label: 60,
  },
  {
    value: 65,
    label: 65,
  },
  {
    value: 70,
    label: 70,
  },
  {
    value: 75,
    label: 75,
  },
];

type DurationByAgeGroup = Partial<Record<AgeGroupTag, DurationOption[]>>;

const DURATION_OPTIONS: Record<LevelTag, DurationByAgeGroup> = {
  BEGINNER: {
    CHILD: [
      {
        value: 20,
        label: 20,
      },
      {
        value: 25,
        label: 25,
      },
      {
        value: 30,
        label: 30,
      },
      {
        value: 35,
        label: 35,
      },
    ],
    ADULT: [
      {
        value: 20,
        label: 20,
      },
      {
        value: 25,
        label: 25,
      },
      {
        value: 30,
        label: 30,
      },
      {
        value: 35,
        label: 35,
      },
      {
        value: 40,
        label: 40,
      },
      {
        value: 45,
        label: 45,
      },
    ],
  },
  ADVANCED: {
    CHILD: [
      {
        value: 20,
        label: 20,
      },
      {
        value: 25,
        label: 25,
      },
      {
        value: 30,
        label: 30,
      },
      {
        value: 35,
        label: 35,
      },
      {
        value: 40,
        label: 40,
      },
      {
        value: 45,
        label: 45,
      },
    ],
    ADULT: [
      {
        value: 20,
        label: 20,
      },
      {
        value: 25,
        label: 25,
      },
      {
        value: 30,
        label: 30,
      },
      {
        value: 35,
        label: 35,
      },
      {
        value: 40,
        label: 40,
      },
      {
        value: 45,
        label: 45,
      },
      {
        value: 50,
        label: 50,
      },
      {
        value: 55,
        label: 55,
      },
      {
        value: 60,
        label: 60,
      },
    ],
  },
  PROFESSIONAL: {
    CHILD: [
      {
        value: 20,
        label: 20,
      },
      {
        value: 25,
        label: 25,
      },
      {
        value: 30,
        label: 30,
      },
      {
        value: 35,
        label: 35,
      },
      {
        value: 40,
        label: 40,
      },
      {
        value: 45,
        label: 45,
      },
    ],
    ADULT: [
      {
        value: 20,
        label: 20,
      },
      {
        value: 25,
        label: 25,
      },
      {
        value: 30,
        label: 30,
      },
      {
        value: 35,
        label: 35,
      },
      {
        value: 40,
        label: 40,
      },
      {
        value: 45,
        label: 45,
      },
      {
        value: 50,
        label: 50,
      },
      {
        value: 55,
        label: 55,
      },
      {
        value: 60,
        label: 60,
      },
      {
        value: 65,
        label: 65,
      },
      {
        value: 70,
        label: 70,
      },
      {
        value: 75,
        label: 75,
      },
    ],
  },
};

const RECOMMENDATIONS_TRAINING_DAYS = {
  BEGINNER: {
    CHILD: {
      PAUSE: 2,
      PREPATORY: 2,
      COMPETITION: 2,
    },
    ADOLESCENT: {
      PAUSE: 2,
      PREPATORY: 3,
      COMPETITION: 2,
    },
    ADULT: {
      PAUSE: 2,
      PREPATORY: 3,
      COMPETITION: 2,
    },
  },
  ADVANCED: {
    CHILD: {
      PAUSE: 2,
      PREPATORY: 3,
      COMPETITION: 2,
    },
    ADOLESCENT: {
      PAUSE: 3,
      PREPATORY: 3,
      COMPETITION: 3,
    },
    ADULT: {
      PAUSE: 3,
      PREPATORY: 3,
      COMPETITION: 3,
    },
  },
  PROFESSIONAL: {
    CHILD: {
      PAUSE: 2,
      PREPATORY: 3,
      COMPETITION: 2,
    },
    ADOLESCENT: {
      PAUSE: 4,
      PREPATORY: 4,
      COMPETITION: 3,
    },
    ADULT: {
      PAUSE: 4,
      PREPATORY: 4,
      COMPETITION: 3,
    },
  },
} as const;

const RECOMMENDATIONS_TRAINING_MINUTES = {
  BEGINNER: {
    CHILD: {
      PAUSE: 35,
      PREPATORY: 35,
      COMPETITION: 35,
    },
    ADOLESCENT: {
      PAUSE: 45,
      PREPATORY: 45,
      COMPETITION: 40,
    },
    ADULT: {
      PAUSE: 45,
      PREPATORY: 45,
      COMPETITION: 40,
    },
  },
  ADVANCED: {
    CHILD: {
      PAUSE: 45,
      PREPATORY: 45,
      COMPETITION: 40,
    },
    ADOLESCENT: {
      PAUSE: 50,
      PREPATORY: 50,
      COMPETITION: 45,
    },
    ADULT: {
      PAUSE: 50,
      PREPATORY: 50,
      COMPETITION: 45,
    },
  },
  PROFESSIONAL: {
    CHILD: {
      PAUSE: 45,
      PREPATORY: 45,
      COMPETITION: 40,
    },
    ADOLESCENT: {
      PAUSE: 60,
      PREPATORY: 60,
      COMPETITION: 50,
    },
    ADULT: {
      PAUSE: 60,
      PREPATORY: 60,
      COMPETITION: 50,
    },
  },
} as const;

const TRAINING_PLACES = [
  {
    displayName: { default: "zu Hause", en: "Home" },
    value: "HOME",
  },
  {
    displayName: { default: "Fitnessstudio", en: "Gym" },
    value: "STUDIO",
  },
  {
    displayName: { default: "in der Halle", en: "Hall" },
    value: "HALL",
  },
  {
    displayName: {
      default: "Draußen/Trainingsplatz",
      en: "Outside/Training ground",
    },
    value: "OUTSIDE",
  },
] as const;

const TRAINING_PLACES_IMAGES: Record<PlaceType, ImageSourcePropType> = {
  HOME: require("../../assets/img/sportsAthletic.png"),
  OUTSIDE: require("../../assets/img/sportsAthletic.png"),
  HALL: require("../../assets/img/sportsAthletic.png"),
  STUDIO: require("../../assets/img/sportsAthletic.png"),
};

const TRAINING_FOCUS_IMAGES: Record<FocusType, ImageSourcePropType> = {
  PHASE: require("../../assets/img/shortTrainings/kraft.png"),
  COMBINED: require("../../assets/img/shortTrainings/kraftausdauer.jpg"),
  CARDIO: require("../../assets/img/shortTrainings/ausdauer.png"),
  STABILITY: require("../../assets/img/shortTrainings/stabilitaet.png"),
};

const TRAINING_DAYS_TITLE = [
  "MONDAY_TRAINING",
  "TUESDAY_TRAINING",
  "WEDNESDAY_TRAINING",
  "THURSDAY_TRAINING",
  "FRIDAY_TRAINING",
  "SATURDAY_TRAINING",
  "SUNDAY_TRAINING",
];

const WEEKDAY_TRAINING_KEYS = [
  "screens.trainingDays.mondayTraining",
  "screens.trainingDays.tuesdayTraining",
  "screens.trainingDays.wednesdayTraining",
  "screens.trainingDays.thursdayTraining",
  "screens.trainingDays.fridayTraining",
  "screens.trainingDays.saturdayTraining",
  "screens.trainingDays.sundayTraining",
] as const;

export type ExerciseDifficultyType =
  | null
  | "TOO_HARD"
  | "TOO_EASY"
  | "SUCCEEDED";

const EXERCISE_DIRECTIONS = {
  VERTICAL_PUSH: "VERTICAL_PUSH",
  VERTICAL_PULL: "VERTICAL_PULL",
  HORIZONTAL_PUSH: "HORIZONTAL_PUSH",
  HORIZONTAL_PULL: "HORIZONTAL_PULL",
  HIP: "HIP",
  KNEE: "KNEE",
  UNTERKOERPER: "UNTERKOERPER",
};

const PAUSE_EXERCISE_ID = "999999";

const TEST_EXERCISES: Record<string, string | undefined> = {
  "7": "bench_press",
  "25": "squad",
  "54": "shoulder_press",
  "88": "rowing",
  "251": "squad",
  "297": "rowing",
  "315": "shoulder_press",
  "317": "shoulder_press",
  "342": "bench_press",
  "355": "bench_press",
};

const TEST_EXERCISES_DIRECTIONS: Record<string, string[] | undefined> = {
  /*
   * 7: Bankdrücken mit 2 KH SWR
   * 25: Kniebeuge mit LH SWR Level 2
   * 54: LH Schulterfrontdrücken SWR
   * 88: Rudern mit 2 KH vorgebeugt (Level 1) SWR
   * 251: Kniebeuge mit 2 KH SWR
   * 297: LH Rudern mit Untergriff SWR + Testeinheit
   * 315: KH Schulterdrücken eng sitzend SWR(Präv) + Präv + Testeinheit (Präv)
   * 317: KH Schulterdrücken (sitzend) SWR + Testeinheit
   * 342: LH Bankdrücken SWR + Testeinheit
   * 355: KH Bankdrücken eng  SWR(Präv) + Präv + Testeinheit
   */
  "7": ["HORIZONTAL_PUSH"],
  "25": ["HIP", "KNEE", "UNTERKOERPER"],
  "54": ["VERTICAL_PUSH", "VERTICAL_PULL"],
  "88": ["HORIZONTAL_PULL"],
  "251": ["HIP", "KNEE", "UNTERKOERPER"],
  "297": ["HORIZONTAL_PULL"],
  "315": ["VERTICAL_PUSH", "VERTICAL_PULL"],
  "317": ["VERTICAL_PUSH", "VERTICAL_PULL"],
  "342": ["HORIZONTAL_PUSH"],
  "355": ["HORIZONTAL_PUSH"],
};

const TEST_EXERCISES_REPETITIONS_PERCENTAGE = [
  0, 1, 0.95, 0.9, 0.875, 0.85, 0.8, 0.775, 0.75, 0.75, 0.725, 0.725, 0.7,
  0.675, 0.675, 0.65,
];

const REP_DURATION_IN_S = 5;
const MAX_VALUES_EXPIRATION_TIME_IN_MS = 8 * SharedConstants.TIME_IN_MS.WEEK;

const MAX_VALUE_TYPES = {
  BARBELL: "barbell",
  DUMBBELLS: "dumbbells",
  ONE_SIDED_UPPER: "oneSidedUpper",
  ONE_SIDED_BARBELL: "oneSidedBarbell",
  ONE_SIDED_LOWER: "oneSidedLower",
  ONE_SIDED_LOWER_SUPPORTED: "oneSidedLowerSupported",
} as const;

const NO_INCREASE_WORKOUT_PLAN_TYPE = ["WU", "CD", "MOB", "BR", "TEST_WORKOUT"];

const NO_INCREASE_SKILL_TYPE = [
  "WU",
  "WUSKSA",
  "WUSPEZIAL",
  "CD",
  "MOB",
  "BR",
  "TEST",
];

const IGNORE_SORENESS_SKILLS = ["WU", "WUSKSA", "CD", "MOB", "BR"];

const EXERCISING_BENCH_EXERCISES = [
  "209",
  "210",
  "211",
  "212",
  "629",
  "630",
  "305",
  "306",
  "617",
  "618",
  "619",
  "960",
  "620",
  "961",
  "621",
  "622",
  "623",
  "624",
  "625",
  "962",
  "626",
  "963",
  "627",
  "964",
  "628",
  "965",
];

type WeightToRepetitions = Record<number, number>;
type DifficultyToWeight = Record<string, WeightToRepetitions>;
type LevelToDifficulty = Record<LevelTag, DifficultyToWeight>;
type AgeGroupToLevel = Record<AgeGroupTag, Partial<LevelToDifficulty>>;

const MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT: Partial<AgeGroupToLevel> =
  {
    ADOLESCENT: {
      ADVANCED: {
        EASY: {
          65: 3,
          67.5: 3,
          70: 3,
          72.5: 2,
          75: 2,
          77.5: 2,
          80: 1,
        },
        MEDIUM: {
          65: 5,
          67.5: 5,
          70: 5,
          72.5: 3,
          75: 3,
          77.5: 3,
          80: 2,
        },
        HARD: {
          65: 6,
          67.5: 6,
          70: 6,
          72.5: 5,
          75: 5,
          77.5: 5,
          80: 3,
        },
      },
      PROFESSIONAL: {
        EASY: {
          65: 5,
          67.5: 5,
          70: 5,
          72.5: 3,
          75: 3,
          77.5: 3,
          80: 2,
        },
        MEDIUM: {
          65: 6,
          67.5: 6,
          70: 6,
          72.5: 5,
          75: 5,
          77.5: 5,
          80: 3,
        },
        HARD: {
          65: 6,
          67.5: 6,
          70: 6,
          72.5: 6,
          75: 6,
          77.5: 6,
          80: 5,
        },
      },
    },
    ADULT: {
      ADVANCED: {
        EASY: {
          65: 3,
          67.5: 3,
          70: 3,
          72.5: 2,
          75: 2,
          77.5: 2,
          80: 1,
        },
        MEDIUM: {
          65: 5,
          67.5: 5,
          70: 5,
          72.5: 3,
          75: 3,
          77.5: 3,
          80: 2,
        },
        HARD: {
          65: 6,
          67.5: 6,
          70: 6,
          72.5: 5,
          75: 5,
          77.5: 5,
          80: 3,
        },
      },
      PROFESSIONAL: {
        EASY: {
          65: 5,
          67.5: 5,
          70: 5,
          72.5: 3,
          75: 3,
          77.5: 3,
          80: 2,
          82.5: 1,
          85: 1,
        },
        MEDIUM: {
          65: 6,
          67.5: 6,
          70: 6,
          72.5: 5,
          75: 5,
          77.5: 5,
          80: 3,
          82.5: 2,
          85: 2,
          87.5: 1,
          90: 1,
        },
        HARD: {
          75: 6,
          77.5: 6,
          80: 5,
          82.5: 3,
          85: 3,
          87.5: 2,
          90: 2,
        },
      },
    },
  };

const MAX_KRAFT_REPETITIONS_WARMUP = [
  { level: "WARMUP", repetitions: 6 },
  { level: "WARMUP", repetitions: 5 },
];

const MAX_KRAFT_WORKING_REPS_PER_USER_LEVEL = {
  PROFESSIONAL: 3,
  ADVANCED: 2,
  BEGINNER: 2,
};

const MAX_KRAFT_WEIGHT_ADJUSTMENT = {
  TOO_HARD: 5,
  SUCCEEDED: 2.5,
  TOO_EASY: 2.5,
};

const MAX_KRAFT_MINIMAL_WEIGHT_PERCENTAGE_PER_USER_LEVEL = {
  PROFESSIONAL: 72.5,
  ADVANCED: 70,
  BEGINNER: 70,
};

const MAX_KRAFT_INCLINE_BENCH_WEIGHT_DIFFERENCE = 7.5;

const SPORTS_SORTED = [
  "HANDBALL_SPORT",
  "FOOTBALL_SPORT",
  "VOLLEYBALL_SPORT",
  "BASKETBALL_SPORT",
  "ICE_HOCKEY_SPORT",
  "HOCKEY_SPORT",
  "AMERICAN_FOOTBALL_SPORT",
  "RUGBY_SPORT",
  "OTHER_SPORT",
] as const;

const SPORTS = {
  HANDBALL_SPORT: "HANDBALL_SPORT",
  FOOTBALL_SPORT: "FOOTBALL_SPORT",
  VOLLEYBALL_SPORT: "VOLLEYBALL_SPORT",
  BASKETBALL_SPORT: "BASKETBALL_SPORT",
  ICE_HOCKEY_SPORT: "ICE_HOCKEY_SPORT",
  HOCKEY_SPORT: "HOCKEY_SPORT",
  AMERICAN_FOOTBALL_SPORT: "AMERICAN_FOOTBALL_SPORT",
  RUGBY_SPORT: "RUGBY_SPORT",
  OTHER_SPORT: "OTHER_SPORT",
} as const;

const SPORTS_IMAGES = {
  HANDBALL_SPORT: require("../../assets/img/sports/Handball.png"),
  FOOTBALL_SPORT: require("../../assets/img/sports/Football.png"),
  VOLLEYBALL_SPORT: require("../../assets/img/sports/Volleyball.png"),
  BASKETBALL_SPORT: require("../../assets/img/sports/Basketball.png"),
  ICE_HOCKEY_SPORT: require("../../assets/img/sports/Eishockey.png"),
  HOCKEY_SPORT: require("../../assets/img/sports/Hockey.png"),
  AMERICAN_FOOTBALL_SPORT: require("../../assets/img/sports/AmericanFootball.png"),
  RUGBY_SPORT: require("../../assets/img/sports/Rugby.png"),
  OTHER_SPORT: require("../../assets/img/sports/SonstigeSportarten.png"),
};

export const WorkoutConstants = {
  AGE_GROUPS,
  AGE_GROUPS_MAX_AGE,
  BIG_MUSCLES,
  DEACTIVATED_EQUIPMENT,
  DEFAULT_DURATION_OPTIONS,
  DURATION_OPTIONS,
  EQUIPMENT,
  EXERCISE_DIRECTIONS,
  EXERCISING_BENCH_EXERCISES,
  HEART_RATE_MAX,
  IGNORE_SORENESS_SKILLS,
  LEVELS,
  MAX_KRAFT_INCLINE_BENCH_WEIGHT_DIFFERENCE,
  MAX_KRAFT_MINIMAL_WEIGHT_PERCENTAGE_PER_USER_LEVEL,
  MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT,
  MAX_KRAFT_REPETITIONS_WARMUP,
  MAX_KRAFT_WEIGHT_ADJUSTMENT,
  MAX_KRAFT_WORKING_REPS_PER_USER_LEVEL,
  MAX_VALUE_TYPES,
  MAX_VALUES_EXPIRATION_TIME_IN_MS,
  MUSCLES,
  NO_INCREASE_SKILL_TYPE,
  NO_INCREASE_WORKOUT_PLAN_TYPE,
  PAUSE_EXERCISE_ID,
  PREVENTION_TILES,
  QUICKSTART_TILES,
  RECOMMENDATIONS_TRAINING_DAYS,
  RECOMMENDATIONS_TRAINING_MINUTES,
  REP_DURATION_IN_S,
  SECTION_ORDER,
  SKILL_TREES,
  SKILL_TYPES,
  SKILL_TREE_HEART_RATES,
  SKILL_TREE_HEART_RATE_DEFAULT,
  SPORTS,
  SPORTS_IMAGES,
  SPORTS_SORTED,
  TEST_EXERCISES,
  TEST_EXERCISES_DIRECTIONS,
  TEST_EXERCISES_REPETITIONS_PERCENTAGE,
  TRAINING_DAYS_TITLE,
  TRAINING_FOCUS_IMAGES,
  TRAINING_PLACES,
  TRAINING_PLACES_IMAGES,
  VALUE_TYPE_NAMES,
  WEEKDAY_TRAINING_KEYS,
} as const;
