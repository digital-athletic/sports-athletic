/**
 * User Models and Defaults
 *
 * Migrated from legacy/models/User.js
 * Complete TypeScript interfaces and default values for user data
 */

// ===== Enums and Constants =====

export const SPORTS = {
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

export type SportType = (typeof SPORTS)[keyof typeof SPORTS];

// ===== Type Definitions =====

export interface UserPersonalDataType {
  username: string;
  picture: {
    path: string;
  };
}

export interface MaxValueType {
  barbell: number | null;
  dumbbells: number | null;
  oneSidedUpper: number | null;
  oneSidedLower: number | null;
  oneSidedLowerSupported: number | null;
}

export interface MaxValuesType {
  testDate: string; // DD-MM-YYYY
  verticalPush: MaxValueType;
  verticalPull: MaxValueType;
  horizontalPush: MaxValueType;
  horizontalPull: MaxValueType;
  hip: MaxValueType;
  knee: MaxValueType;
  unterkoerper: MaxValueType;
}

export interface SeasonPhaseType {
  type: string | null;
  endDate: string; // DD-MM-YYYY
}

export interface UserWorkoutDataType {
  anamnesisCompleted: boolean;
  gender: "MALE" | "FEMALE";
  birthday: string; // DD-MM-YYYY
  weight: string;
  height: string;
  sport: SportType;
  tags: string[];
  seasonPhase: SeasonPhaseType;
  maxValues: MaxValuesType;
}

export interface TrainingDayType {
  active: boolean;
  weekday: number; // 0-6
  duration: number; // minutes
  place: "HOME" | "STUDIO" | "HALL" | "OUTSIDE";
}

export interface TemporalDataType {
  // TODO: Define structure when needed
  [key: string]: any;
}

export interface ReviewStatusType {
  hasGivenReview: boolean;
  reviewDate: number;
  reviewYears: number;
  reviewSkips: number;
}

export interface UserSettingsType {
  anonymisedDataUse: boolean;
  reviewStatus: ReviewStatusType;
}

export interface UserStatisticsType {
  totals: {
    reps: number;
    weight: number;
    time: number;
  };
  lastWeek: {
    reps: number;
    weight: number;
    time: number;
  };
}

export interface UserProgressType {
  xp: number;
  level: number;
  rank: string;
  totals: {
    weightMoved: number;
    timeTrained: number;
    timeActive: number;
    timeInactive: number;
    timeStreched: number;
    timeMobilysed: number;
    jumpsDone: number;
    stepsDone: number;
  };
  qualities: Record<string, any>;
  exercises: Record<string, any>;
  testHistory: any[];
}

export interface TrainingPlanType {
  // TODO: Define structure when needed
  [key: string]: any;
}

export interface UserType {
  userId: string;
  personalData: UserPersonalDataType;
  workoutData: UserWorkoutDataType | null;
  temporalData: TemporalDataType[];
  completedWorkouts?: Record<string, any>;
  settings: UserSettingsType;
  statistics: UserStatisticsType;
  trainingPlan: TrainingPlanType | null;
  teamId: string;
  isInInitialAnamnesis: boolean;
}

// ===== Default Values =====

export const DEFAULT_MAX_VALUE: MaxValueType = {
  barbell: null,
  dumbbells: null,
  oneSidedUpper: null,
  oneSidedLower: null,
  oneSidedLowerSupported: null,
};

export const DEFAULT_MAX_VALUES: MaxValuesType = {
  testDate: "01-01-1990",
  verticalPush: DEFAULT_MAX_VALUE,
  verticalPull: DEFAULT_MAX_VALUE,
  horizontalPush: DEFAULT_MAX_VALUE,
  horizontalPull: DEFAULT_MAX_VALUE,
  hip: DEFAULT_MAX_VALUE,
  knee: DEFAULT_MAX_VALUE,
  unterkoerper: DEFAULT_MAX_VALUE,
};

const getCurrentDate = (): string => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const DEFAULT_WORKOUT_DATA: UserWorkoutDataType = {
  anamnesisCompleted: false,
  gender: "MALE",
  birthday: "01-01-2000",
  weight: "65",
  height: "175",
  sport: SPORTS.OTHER_SPORT,
  tags: ["POSITION_FIELD", "LEVEL_BEGINNER"],
  seasonPhase: {
    type: null,
    endDate: getCurrentDate(),
  },
  maxValues: DEFAULT_MAX_VALUES,
};

export const DEFAULT_TRAINING_DAYS: TrainingDayType[] = [
  { active: false, weekday: 0, duration: 30, place: "STUDIO" },
  { active: false, weekday: 1, duration: 30, place: "STUDIO" },
  { active: false, weekday: 2, duration: 30, place: "STUDIO" },
  { active: false, weekday: 3, duration: 30, place: "STUDIO" },
  { active: false, weekday: 4, duration: 30, place: "STUDIO" },
  { active: false, weekday: 5, duration: 30, place: "STUDIO" },
  { active: false, weekday: 6, duration: 30, place: "STUDIO" },
];

export const DEFAULT_PROGRESS: UserProgressType = {
  xp: 0,
  level: 1,
  rank: "Lauch",
  totals: {
    weightMoved: 0,
    timeTrained: 0,
    timeActive: 0,
    timeInactive: 0,
    timeStreched: 0,
    timeMobilysed: 0,
    jumpsDone: 0,
    stepsDone: 0,
  },
  qualities: {},
  exercises: {},
  testHistory: [],
};

export const DEFAULT_PERSONAL_DATA: UserPersonalDataType = {
  username: "",
  picture: {
    path: "",
  },
};

export const DEFAULT_USER: UserType = {
  userId: "",
  personalData: DEFAULT_PERSONAL_DATA,
  workoutData: DEFAULT_WORKOUT_DATA,
  temporalData: [],
  completedWorkouts: {},
  settings: {
    anonymisedDataUse: false,
    reviewStatus: {
      hasGivenReview: false,
      reviewDate: 0,
      reviewYears: 0,
      reviewSkips: 0,
    },
  },
  statistics: {
    totals: {
      reps: 0,
      weight: 0,
      time: 0,
    },
    lastWeek: {
      reps: 0,
      weight: 0,
      time: 0,
    },
  },
  trainingPlan: null,
  teamId: "",
  isInInitialAnamnesis: false,
};

// Equipment defaults - simplified for now
// TODO: Import actual equipment lists from assets/data/generator/places when needed
const DEFAULT_EQUIPMENT: string[] = [];

export const DEFAULT_FIREBASE_USERDATA = {
  personalData: {
    username: "",
    picture: {
      path: "",
    },
  },
  exerciseData: {
    branchData: {},
    exerciseData: {},
  },
  places: {
    HALL: DEFAULT_EQUIPMENT,
    HOME: DEFAULT_EQUIPMENT,
    OUTSIDE: DEFAULT_EQUIPMENT,
    STUDIO: DEFAULT_EQUIPMENT,
  },
  progress: DEFAULT_PROGRESS,
  trainingDays: DEFAULT_TRAINING_DAYS,
  workoutData: DEFAULT_WORKOUT_DATA,
};
