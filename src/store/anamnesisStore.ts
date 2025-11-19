import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface AnamnesisQuestionType {
  title: { [language: string]: string };
  description?: string;
  placeholder: { [langKey: string]: string };
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
  tag?: string;
  values?: string[];
  dataField?: string;
  dataType?: "single" | "multiple";
  bodyPartType?: "MUSCLE" | "PAIN";
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
  originPath: string | undefined;
  isLoading: boolean;

  // Actions
  setQuestions: (questions: AnamnesisQuestionGroupType[]) => void;
  loadQuestions: () => Promise<void>;
  setValue: (path: string, value: any) => void;
  setTag: (tag: string, values: string[]) => void;
  setOriginPath: (path: string | undefined) => void;
  clearValues: () => void;
  resetAnamnesis: () => void;
  fillAnamnesisData: (
    tags: string[],
    workoutData: { [key: string]: any }
  ) => void;
}

const DEFAULT_STATE = {
  questions: [],
  values: {},
  tags: {},
  originPath: undefined,
  isLoading: false,
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
          const questionsData: AnamnesisQuestionGroupType[] = [];

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

      clearValues: () => {
        set((state) => {
          state.values = {};
          state.tags = {};
        });
      },

      resetAnamnesis: () => {
        set((state) => {
          state.questions = [];
          state.values = {};
          state.tags = {};
          state.originPath = undefined;
          state.isLoading = false;
        });
      },

      fillAnamnesisData: (tags, workoutData) => {
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
