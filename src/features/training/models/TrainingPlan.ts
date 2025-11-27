import { type TrainingSectionType } from "./TrainingSection";

export type TrainingPlanType = {
  start: Date; // can be any time the plan is created
  sections: TrainingSectionType[];
};
