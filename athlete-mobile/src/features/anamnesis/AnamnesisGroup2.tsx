import type { AnamnesisQuestionProps } from "./components/AnamnesisQuestionProps";
import { FitnessLevelQuestion } from "./components/FitnessLevelQuestion";
import { PositionQuestion } from "./components/PositionQuestion";

export function AnamnesisGroup2(props: AnamnesisQuestionProps) {
  return (
    <>
      <PositionQuestion {...props} />
      <FitnessLevelQuestion {...props} />
    </>
  );
}
