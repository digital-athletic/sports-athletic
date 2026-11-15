export type SportTestReferenceValue = {
  gender: "MALE" | "FEMALE";
  position: string;
  trainingStage: string;
  minAge: number;
  maxAge: number;
  rangeStart: number;
  rangeEnd: number;
};

export type SportTest = {
  id: string;
  code: string;
  unit: string;
  referenceValues: SportTestReferenceValue[];
};
