// @flow
// @format
import type { MaxValuesType } from "./MaxValues";

export type UserProgressType = {
  xp: number;
  level: number;
  rank: string; // TODO do we need this?
  totals: {
    //TODO mglw in statistics schieben?
    weightMoved: number;
    timeTrained: number;
    timeActive: number;
    timeInactive: number;
    timeStreched: number;
    timeMobilysed: number;
    jumpsDone: number;
    stepsDone: number;
    exercisesSkipped: number;
  }; // TODO festlegen oder erweiterbar machen (siehe qualities)
  qualities: { [key: string]: number };
  exercises: {
    [exerciseId: string]: {
      duration: number;
      height: number;
      repetition: number;
      weight: number;
    };
  };
  testHistory?: MaxValuesType[];
};
