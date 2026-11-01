import { getAllExercises } from "./exerciseRegistry";
import { loadDirections } from "./loadDirections";
import { loadMaxMinutes } from "./loadMaxMinutes";
import { loadPlanAuthoredData } from "./loadPlanAuthoredData";
import { loadRegionConfig } from "./loadRegionConfig";
import { loadSectionTemplate } from "./loadSectionTemplates";
import { loadSkillPriorities } from "./loadSkillPriorities";
import { getAllSkillTrees } from "./skillTreeRegistry";

describe("loadPlanAuthoredData", () => {
  it("holds the section template of every season phase, age group and fitness level", () => {
    const { sectionTemplates } = loadPlanAuthoredData();

    expect(Object.keys(sectionTemplates)).toEqual([
      "pause",
      "preparatory",
      "competition",
    ]);
    expect(sectionTemplates.competition.child.professional).toEqual(
      loadSectionTemplate("COMPETITION", "CHILD", "PROFESSIONAL"),
    );
  });

  it("holds the region configuration of every skill", () => {
    const { regionConfigs } = loadPlanAuthoredData();

    expect(regionConfigs.PREVKNEE).toEqual(loadRegionConfig("PREVKNEE"));
    expect(regionConfigs.SWR2KG).toEqual(loadRegionConfig("SWR2KG"));
  });

  it("holds the movement direction configurations, skill priorities and maximum minutes", () => {
    const data = loadPlanAuthoredData();

    expect(data.movementDirections).toEqual(loadDirections());
    expect(data.skillPriorities).toEqual(loadSkillPriorities());
    expect(data.maxMinutes).toEqual(loadMaxMinutes());
  });

  it("holds the skill trees and the exercise catalog of the registries", () => {
    const data = loadPlanAuthoredData();

    expect(data.skillTrees).toBe(getAllSkillTrees());
    expect(data.exerciseCatalog).toBe(getAllExercises());
  });

  it("parses the configurations once and freezes them", () => {
    const first = loadPlanAuthoredData();
    const second = loadPlanAuthoredData();

    expect(second.sectionTemplates).toBe(first.sectionTemplates);
    expect(Object.isFrozen(first.movementDirections)).toBe(true);
    expect(Object.isFrozen(first.regionConfigs.SWR1)).toBe(true);
  });
});
