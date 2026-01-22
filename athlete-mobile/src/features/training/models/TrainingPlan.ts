import {
  type SectionWithStartType,
  type TrainingSectionType,
} from "./TrainingSection";

export type TrainingPlanType = {
  start: Date; // can be any time the plan is created
  sections: TrainingSectionType[];
};

// Intermediate type: plan before trainings are generated for each section
export type TrainingPlanInitialType = {
  start: Date;
  sections: SectionWithStartType[];
};
