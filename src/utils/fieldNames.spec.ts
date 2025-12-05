import { fieldNamesToLowerCase } from "./fieldNames";

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
