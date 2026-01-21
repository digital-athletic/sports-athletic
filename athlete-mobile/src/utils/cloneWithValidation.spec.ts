import * as v from "valibot";
import { cloneWithValidation } from "./cloneWithValidation";

describe("cloneWithValidation", () => {
  const TestSchema = v.object({
    id: v.string(),
    count: v.number(),
  });

  it("returns validated data for valid input", () => {
    const input = { id: "test", count: 42 };
    const result = cloneWithValidation(input, TestSchema, "TestSchema");

    expect(result).toEqual({ id: "test", count: 42 });
  });

  it("returns a deep clone, not the original object", () => {
    const input = { id: "test", count: 42 };
    const result = cloneWithValidation(input, TestSchema, "TestSchema");

    expect(result).not.toBe(input);
    result.count = 100;
    expect(input.count).toBe(42);
  });

  it("throws error for invalid data", () => {
    const invalid = { id: 123, count: "not a number" };

    expect(() =>
      cloneWithValidation(invalid, TestSchema, "TestSchema"),
    ).toThrow("Invalid data structure for TestSchema");
  });

  it("throws error for missing required fields", () => {
    const incomplete = { id: "test" };

    expect(() =>
      cloneWithValidation(incomplete, TestSchema, "TestSchema"),
    ).toThrow("Invalid data structure for TestSchema");
  });

  it("strips extra properties with strict schema", () => {
    const StrictSchema = v.object({
      name: v.string(),
    });
    const input = { name: "test", extra: "field" };
    const result = cloneWithValidation(input, StrictSchema, "StrictSchema");

    expect(result).toEqual({ name: "test" });
    expect(result).not.toHaveProperty("extra");
  });

  it("handles nested objects", () => {
    const NestedSchema = v.object({
      user: v.object({
        name: v.string(),
      }),
    });
    const input = { user: { name: "John" } };
    const result = cloneWithValidation(input, NestedSchema, "NestedSchema");

    expect(result.user.name).toBe("John");
  });

  it("handles arrays", () => {
    const ArraySchema = v.array(v.number());
    const input = [1, 2, 3];
    const result = cloneWithValidation(input, ArraySchema, "ArraySchema");

    expect(result).toEqual([1, 2, 3]);
  });
});
