import { fieldNamesToLowerCase, transformExerciseData } from "./fieldNames";

describe("fieldNamesToLowerCase", () => {
  it("converts PascalCase to camelCase", () => {
    const input = [{ FirstName: "John", LastName: "Doe" }];
    const result = fieldNamesToLowerCase(input);
    expect(result[0]).toEqual({ firstName: "John", lastName: "Doe" });
  });

  it("handles multiple objects in array", () => {
    const input = [{ FirstName: "John" }, { FirstName: "Jane" }];
    const result = fieldNamesToLowerCase(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ firstName: "John" });
    expect(result[1]).toEqual({ firstName: "Jane" });
  });

  it("preserves field values", () => {
    const input = [{ FirstName: "John", Age: 30, IsActive: true }];
    const result = fieldNamesToLowerCase(input);
    expect(result[0]).toEqual({ firstName: "John", age: 30, isActive: true });
  });

  it("handles empty array", () => {
    const input: Record<string, any>[] = [];
    const result = fieldNamesToLowerCase(input);
    expect(result).toEqual([]);
  });

  it("handles already lowercase keys", () => {
    const input = [{ firstName: "John", lastName: "Doe" }];
    const result = fieldNamesToLowerCase(input);
    expect(result[0]).toEqual({ firstName: "John", lastName: "Doe" });
  });

  it("handles mixed case keys", () => {
    const input = [{ FirstName: "John", lastName: "Doe", AGE: 30 }];
    const result = fieldNamesToLowerCase(input);
    expect(result[0]).toEqual({ firstName: "John", lastName: "Doe", aGE: 30 });
  });

  it("handles single character keys", () => {
    const input = [{ A: "value", B: "another" }];
    const result = fieldNamesToLowerCase(input);
    expect(result[0]).toEqual({ a: "value", b: "another" });
  });

  it("does not mutate original array", () => {
    const input = [{ FirstName: "John" }];
    const original = JSON.parse(JSON.stringify(input));
    fieldNamesToLowerCase(input);
    expect(input).toEqual(original);
  });

  it("handles nested objects as values", () => {
    const input = [{ FirstName: "John", Details: { City: "NYC" } }];
    const result = fieldNamesToLowerCase(input);
    expect(result[0]).toEqual({
      firstName: "John",
      details: { City: "NYC" },
    });
  });

  it("handles arrays as values", () => {
    const input = [{ FirstName: "John", Tags: ["tag1", "tag2"] }];
    const result = fieldNamesToLowerCase(input);
    expect(result[0]).toEqual({
      firstName: "John",
      tags: ["tag1", "tag2"],
    });
  });

  it("handles null and undefined values", () => {
    const input = [{ FirstName: "John", MiddleName: null, Suffix: undefined }];
    const result = fieldNamesToLowerCase(input);
    expect(result[0]).toEqual({
      firstName: "John",
      middleName: null,
      suffix: undefined,
    });
  });
});

describe("transformExerciseData", () => {
  it("converts id to string", () => {
    const input = [{ Id: 123, Name: "Exercise" }];
    const result = transformExerciseData(input);
    expect(result[0].id).toBe("123");
    expect(typeof result[0].id).toBe("string");
  });

  it("converts otherSideExerciseId to string when present", () => {
    const input = [{ Id: 123, OtherSideExerciseId: 456 }];
    const result = transformExerciseData(input);
    expect(result[0].otherSideExerciseId).toBe("456");
    expect(typeof result[0].otherSideExerciseId).toBe("string");
  });

  it("does not include otherSideExerciseId when undefined", () => {
    const input = [{ Id: 123, Name: "Exercise" }];
    const result = transformExerciseData(input);
    expect(result[0]).not.toHaveProperty("otherSideExerciseId");
  });

  it("converts equivalentExercises array to strings", () => {
    const input = [{ Id: 123, EquivalentExercises: [456, 789, 101] }];
    const result = transformExerciseData(input);
    expect(result[0].equivalentExercises).toEqual(["456", "789", "101"]);
  });

  it("does not include equivalentExercises when undefined", () => {
    const input = [{ Id: 123, Name: "Exercise" }];
    const result = transformExerciseData(input);
    expect(result[0]).not.toHaveProperty("equivalentExercises");
  });

  it("converts field names to camelCase", () => {
    const input = [{ Id: 123, DisplayName: "Test Exercise", Tags: ["tag1"] }];
    const result = transformExerciseData(input);
    expect(result[0]).toHaveProperty("displayName", "Test Exercise");
    expect(result[0]).toHaveProperty("tags", ["tag1"]);
  });

  it("handles multiple exercises", () => {
    const input = [
      { Id: 1, Name: "Ex1" },
      { Id: 2, Name: "Ex2", OtherSideExerciseId: 3 },
    ];
    const result = transformExerciseData(input);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("2");
    expect(result[1].otherSideExerciseId).toBe("3");
  });
});
