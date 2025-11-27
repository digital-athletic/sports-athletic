import { TagGroups } from "@/constants/tagGroups";
import { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { Route } from "expo-router";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export type LocalizedText = {
  [language: string]: string;
  default: string;
};

export interface AnamnesisQuestionType {
  title: LocalizedText;
  description?: LocalizedText;
  placeholder: LocalizedText;
  type:
    | "text"
    | "select"
    | "selectMultiple"
    | "switch"
    | "snap"
    | "email"
    | "password"
    | "date"
    | "time"
    | "bodyParts";
  tag?: TagGroups;
  values?: string[];
  dataField?: string;
  dataType?: "single" | "multiple" | "tag";
  bodyPartType?: "MUSCLE" | "PAIN";
  icon?: string;
}

export interface AnamnesisQuestionGroupType {
  groupTitle: string;
  ordering: number;
  questions: AnamnesisQuestionType[];
}

export interface AnamnesisState {
  questions: AnamnesisQuestionGroupType[];
  values: { [path: string]: any };
  tags: { [tag: string]: string[] };
  originPath?: Route;
  isLoading: boolean;
  seasonPhase: SeasonPhaseType | null;

  // Actions
  setQuestions: (questions: AnamnesisQuestionGroupType[]) => void;
  loadQuestions: () => Promise<void>;
  setValue: (path: string, value: any) => void;
  setTag: (tag: string, values: string[]) => void;
  setOriginPath: (path?: Route) => void;
  setSeasonPhase: (phase: SeasonPhaseType | null) => void;
  resetData: () => void;
  setCompleted: () => Promise<void>;
  saveData: () => Promise<void>;
  fillData: (tags: string[], workoutData: { [key: string]: any }) => void;
}

type WithoutFunctions<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K];
};

export const MOCKED_STATE: AnamnesisQuestionGroupType[] = [
  {
    groupTitle: "Personal Information",
    ordering: 0,
    questions: [
      {
        title: { default: "What is your name?" },
        description: { default: "Please enter your full name" },
        placeholder: { default: "Enter your name" },
        type: "text",
        dataField: "personalData.name",
      },
      {
        title: { default: "What is your email?" },
        description: { default: "We'll use this to contact you" },
        placeholder: { default: "Enter your email" },
        type: "email",
        dataField: "personalData.email",
      },
      {
        title: { default: "Create a password" },
        description: { default: "Secure your account with a strong password" },
        placeholder: { default: "Enter password" },
        type: "password",
        dataField: "personalData.password",
      },
    ],
  },
  {
    groupTitle: "Training Details",
    ordering: 1,
    questions: [
      {
        title: { default: "What sport do you practice?" },
        description: { default: "Select your primary sport" },
        placeholder: { default: "Select a sport" },
        type: "select",
        values: ["Soccer", "Basketball", "Tennis", "Running", "Swimming"],
        dataField: "sport",
      },
      {
        title: { default: "What equipment do you have?" },
        description: { default: "Select all available equipment" },
        placeholder: { default: "Select equipment" },
        type: "selectMultiple",
        values: [
          "Dumbbells",
          "Barbell",
          "Resistance Bands",
          "Yoga Mat",
          "Kettlebell",
        ],
        tag: TagGroups.EQUIPMENT,
        dataField: "equipment",
      },
      {
        title: { default: "Training experience level" },
        description: { default: "Rate your training experience" },
        placeholder: { default: "Select your level" },
        type: "snap",
        values: ["Beginner", "Intermediate", "Advanced", "Expert"],
        tag: TagGroups.LEVEL,
      },
    ],
  },
  {
    groupTitle: "Health & Injuries",
    ordering: 2,
    questions: [
      {
        title: { default: "Do you have any pain or injuries?" },
        description: { default: "Select areas where you experience pain" },
        placeholder: { default: "Select affected areas" },
        type: "bodyParts",
        bodyPartType: "PAIN",
        tag: TagGroups.PAIN,
        dataType: "tag",
        dataField: "pain",
      },
      {
        title: { default: "Previous injuries" },
        description: { default: "Select areas you've injured before" },
        placeholder: { default: "Select body parts" },
        type: "bodyParts",
        bodyPartType: "MUSCLE",
        tag: TagGroups.MUSCLE,
        dataType: "tag",
        dataField: "injuries",
      },
      {
        title: { default: "Do you have access to a gym?" },
        description: { default: "Toggle if you have gym access" },
        placeholder: { default: "" },
        type: "switch",
        dataField: "health.hasGymAccess",
      },
    ],
  },
  // can be added again when we have the prebuild setup
  // {
  //   groupTitle: "Schedule",
  //   ordering: 3,
  //   questions: [
  //     {
  //       title: { default: "What is your birth date?" },
  //       description: { default: "Please enter your date of birth" },
  //       placeholder: { default: "DD-MM-YYYY" },
  //       type: "date",
  //       dataField: "personalData.birthDate",
  //     },
  //     {
  //       title: { default: "What time do you usually train?" },
  //       description: { default: "Select your preferred training time" },
  //       placeholder: { default: "HH:MM" },
  //       type: "time",
  //       dataField: "schedule.trainingTime",
  //     },
  //     {
  //       title: { default: "Season phase end date" },
  //       description: { default: "When does your current training phase end?" },
  //       placeholder: { default: "DD-MM-YYYY" },
  //       type: "date",
  //       dataField: "seasonPhase.endDate",
  //     },
  //   ],
  // },
];

const DEFAULT_STATE: WithoutFunctions<AnamnesisState> = {
  questions: [],
  values: {},
  tags: {},
  originPath: undefined,
  isLoading: false,
  seasonPhase: null,
};

/**
 * Anamnesis Store
 *
 * Manages the anamnesis questionnaire state including questions, user answers,
 * tags, and navigation origin. This store handles the multi-step anamnesis flow
 * and persists user responses across sessions.
 *
 * @example
 * ```tsx
 * const { questions, values, loadQuestions, setValue } = useAnamnesisStore();
 *
 * // Load questions on mount
 * useEffect(() => {
 *   loadQuestions();
 * }, [loadQuestions]);
 *
 * // Save user answer
 * setValue('user.height', 180);
 * ```
 */
export const useAnamnesisStore = create<AnamnesisState>()(
  persist(
    immer((set, get) => ({
      ...DEFAULT_STATE,

      setQuestions: (questions) => {
        set((state) => {
          state.questions = questions;
        });
      },

      loadQuestions: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          // TODO: Replace with actual API call or static data import
          // For now, return empty array until AnamnesisService is migrated
          // const anamnesisService = new AnamnesisService();
          // const questionsData = await anamnesisService.getAnamnesisQuestions();

          // Mock implementation - replace with actual service call
          const questionsData: AnamnesisQuestionGroupType[] = MOCKED_STATE;

          set((state) => {
            state.questions = questionsData;
            state.isLoading = false;
          });
        } catch (error) {
          console.error("Failed to load anamnesis questions:", error);
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      setValue: (path, value) => {
        set((state) => {
          state.values[path] = value;
        });
      },

      setTag: (tag, values) => {
        set((state) => {
          state.tags[tag] = values;
        });
      },

      setOriginPath: (path) => {
        set((state) => {
          state.originPath = path;
        });
      },

      setSeasonPhase: (phase) => {
        set((state) => {
          state.seasonPhase = phase;
        });
      },

      resetData: () => {
        const currentOriginPath = get().originPath;
        set((state) => {
          state.questions = [];
          state.values = {};
          state.tags = {};
          state.originPath = currentOriginPath; // Preserve origin path like legacy
          state.isLoading = false;
          state.seasonPhase = null;
        });
      },

      setCompleted: async () => {
        // TODO: Implement with Firebase service
        // This should call userStore to set anamnesisCompleted flag
        console.log("setCompleted called");
      },

      saveData: async () => {
        const { values, tags } = get();
        // TODO: Implement with Firebase service
        // This should save both values and tags to Firebase
        console.log("saveData called", { values, tags });
      },

      fillData: (tags, workoutData) => {
        const { questions } = get();

        set((state) => {
          for (const questionGroup of questions) {
            for (const question of questionGroup.questions) {
              // Check if this is a tag-based question
              if (question.tag) {
                // Extract values for this tag from the tags array
                const tagPrefix = question.tag;
                const tagValues = tags.filter((tag) =>
                  tag.startsWith(`${tagPrefix}_`)
                );
                state.tags[tagPrefix] = tagValues;
              } else if (question.dataField) {
                // Get value from workoutData
                const value = workoutData[question.dataField];
                if (value !== undefined) {
                  state.values[question.dataField] = value;
                }
              }
            }
          }
        });
      },
    })),
    {
      name: "anamnesis-storage",
      storage: asyncStorage,
    }
  )
);
