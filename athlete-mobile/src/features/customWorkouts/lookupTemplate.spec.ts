import { lookupTemplate, lookupTemplateName } from "./lookupTemplate";
import { loadTemplate } from "@/data/loadTemplates";
import type { Template } from "@/schemas/aiwl.schema";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";

// e.g. { aiwl: 1, id: "GKS", name: { en: "Core", de: "Rumpf" }, blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }] }
const generateCustomTemplate = (
  overrides: Partial<Template> = {},
): Template => ({
  aiwl: 1,
  id: "MY_CORE",
  name: { en: "Core", de: "Rumpf" },
  blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }],
  ...overrides,
});

describe("lookupTemplate: bundled and imported templates", () => {
  beforeEach(() => {
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
  });

  afterEach(() => {
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
  });

  it("returns the bundled template even when an imported entry shares its file id", () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate({ id: "GKS" }), null);

    expect(lookupTemplate("GKS")).toBe(loadTemplate("GKS"));
  });

  it("returns the template of an own imported entry by app id", () => {
    const template = generateCustomTemplate();
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(template, null);

    expect(lookupTemplate(id)).toEqual(template);
  });

  it("returns the template of a team imported entry by app id", () => {
    const template = generateCustomTemplate();
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(template, "team-1");

    expect(lookupTemplate(id)).toEqual(template);
  });

  it("returns the template from the passed workouts instead of the store", () => {
    const template = generateCustomTemplate();
    const workoutsById = {
      "custom-passed": {
        id: "custom-passed",
        teamId: null,
        importedAt: 1,
        template,
      },
    };

    expect(lookupTemplate("custom-passed", workoutsById)).toEqual(template);
  });

  it.each(["custom-unknown", "PLAN"])("returns undefined for %s", (id) => {
    expect(lookupTemplate(id)).toBeUndefined();
  });
});

describe("lookupTemplateName: bundled and imported names", () => {
  beforeEach(() => {
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
  });

  afterEach(() => {
    useCustomWorkoutsStore.getState().clearCustomWorkouts();
  });

  it("returns the German name of an imported entry for German", () => {
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    expect(lookupTemplateName(id, "de")).toBe("Rumpf");
  });

  it("falls back to the English name of an imported entry for French", () => {
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateCustomTemplate(), null);

    expect(lookupTemplateName(id, "fr")).toBe("Core");
  });

  it("returns the German name of a bundled template for German", () => {
    expect(lookupTemplateName("PREVKNEE", "de")).toBe(
      "Knie- und Hüftprävention",
    );
  });

  it("returns undefined for an unknown id", () => {
    expect(lookupTemplateName("PLAN", "en")).toBeUndefined();
  });
});
