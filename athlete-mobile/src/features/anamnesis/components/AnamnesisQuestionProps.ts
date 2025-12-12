export interface AnamnesisQuestionProps {
  values: Record<string, unknown>;
  tags: Record<string, string[]>;
  personalData?: {
    gender?: "MALE" | "FEMALE";
  };
  onChangeValue: (field: string, value: unknown) => void;
  onChangeTag: (tag: string, values: string[]) => void;
}
