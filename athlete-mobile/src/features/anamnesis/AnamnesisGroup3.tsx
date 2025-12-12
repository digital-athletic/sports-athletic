import type { AnamnesisQuestionProps } from "./components/AnamnesisQuestionProps";
import { PainQuestion } from "./components/PainQuestion";

export function AnamnesisGroup3(props: AnamnesisQuestionProps) {
  return (
    <>
      <PainQuestion {...props} />
    </>
  );
}
