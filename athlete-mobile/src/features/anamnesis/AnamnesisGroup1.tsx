import type { AnamnesisQuestionProps } from "./components/AnamnesisQuestionProps";
import { HeightQuestion } from "./components/HeightQuestion";
import { WeightQuestion } from "./components/WeightQuestion";

export function AnamnesisGroup1(props: AnamnesisQuestionProps) {
  return (
    <>
      <HeightQuestion {...props} />
      <WeightQuestion {...props} />
    </>
  );
}
