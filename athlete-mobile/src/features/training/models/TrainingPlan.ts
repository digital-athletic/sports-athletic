import {
  type SectionWithStartType,
  type TrainingSectionType,
} from "./TrainingSection";

export type TrainingPlanType = {
  start: string; // ISO 8601 date string when the plan is created
  sections: TrainingSectionType[];
};

// Intermediate type: plan before trainings are generated for each section
export type TrainingPlanInitialType = {
  start: string;
  sections: SectionWithStartType[];
};
