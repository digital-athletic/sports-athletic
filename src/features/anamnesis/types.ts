export type AnamnesisQuestionType = {
  title: { [language: string]: string }; // can always fallback to "default"
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
    | "bodyParts"; // TODO possibly move to constants
  tag?: string; // tag prefix for entered value
  values?: string[]; // select(Multiple)
  dataField?: string; // path to the field where the input should be saved
  dataType?: "single" | "multiple"; // save one value | an array of values at the given path
  bodyPartType?: "MUSCLE" | "PAIN";
};
