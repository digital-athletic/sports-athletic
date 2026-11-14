export type SportTestReferenceValue = {
  gender: "MALE" | "FEMALE";
  position: string;
  trainingStage: string;
  rangeStart: number;
  rangeEnd: number;
};

export type SportTest = {
  id: string;
  code: string;
  unit: string;
  referenceValues: SportTestReferenceValue[];
};
