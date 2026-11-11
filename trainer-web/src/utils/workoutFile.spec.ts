import { describe, expect, it } from "vitest";
import { workoutFileName } from "./workoutFile";

const templateNamed = (name: string) => ({
  name: { en: name, de: name },
  blocks: [{ skill: "strength", picks: 3 }],
});

describe("workoutFileName", () => {
  it.each([
    ["Tuesday stability", "tuesday-stability.json"],
    ["Größe Übung für Füße", "grosse-ubung-fur-fusse.json"],
    ["Équipe à Señor Ørsted", "equipe-a-senor-rsted.json"],
    ["  --Core & Hips (v2)!  ", "core-hips-v2.json"],
  ])("names %j as %s", (name, fileName) => {
    expect(workoutFileName(templateNamed(name))).toBe(fileName);
  });

  it.each([
    ["an empty name", templateNamed("")],
    ["a name without letters or digits", templateNamed("!?—")],
    ["no name", { blocks: [] }],
    ["a template that is not an object", "not a template"],
  ])("falls back to workout.json for %s", (_label, template) => {
    expect(workoutFileName(template)).toBe("workout.json");
  });
});
