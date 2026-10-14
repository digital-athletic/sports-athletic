import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { migratePlanSkillTags, migrateSkillTags } from "./skillTagMigration";

const planWithBranchTags = (tags: string[]): TrainingPlanType =>
  ({
    start: "2026-10-05",
    sections: [
      {
        type: "SK",
        trainings: [
          {
            weekday: 1,
            skills: { SK: [{ branchId: "213", tags, exercises: {} }] },
            lengths: { SK: 20 },
            focus: "PHASE",
          },
        ],
      },
    ],
  }) as unknown as TrainingPlanType;

const branchTagsOf = (plan: TrainingPlanType | null) =>
  plan?.sections[0].trainings[0].skills.SK?.[0].tags;

describe("skillTagMigration: migrateSkillTags", () => {
  it.each([
    ["SKILL_SCHNELLKRAFT", "SKILL_EXPLOSIVE_POWER"],
    ["SKILL_MAX_KRAFT", "SKILL_MAX_STRENGTH"],
    ["SKILL_MAX_KRAFT_TEST", "SKILL_MAX_STRENGTH_TEST"],
    ["SKILL_SCHNELLIGKEITSAUSDAUER", "SKILL_POWER_ENDURANCE"],
    ["SKILL_SCHNELLIGKEITSAUSDAUER_SPECIAL", "SKILL_POWER_ENDURANCE_SPECIAL"],
  ])("renames %s to %s", (oldTag, newTag) => {
    expect(migrateSkillTags([oldTag])).toEqual([newTag]);
  });

  it("keeps other tags and their order", () => {
    expect(
      migrateSkillTags(["PLACE_STUDIO", "SKILL_SCHNELLKRAFT", "SIDE_BOTH"]),
    ).toEqual(["PLACE_STUDIO", "SKILL_EXPLOSIVE_POWER", "SIDE_BOTH"]);
  });

  it("keeps tags that already carry the English name", () => {
    expect(migrateSkillTags(["SKILL_EXPLOSIVE_POWER"])).toEqual([
      "SKILL_EXPLOSIVE_POWER",
    ]);
  });
});

describe("skillTagMigration: migratePlanSkillTags", () => {
  it("renames the skill tags of every stored branch", () => {
    const plan = planWithBranchTags(["SKILL_SCHNELLKRAFT", "PLACE_STUDIO"]);
    expect(branchTagsOf(migratePlanSkillTags(plan))).toEqual([
      "SKILL_EXPLOSIVE_POWER",
      "PLACE_STUDIO",
    ]);
  });

  it("keeps the rest of the plan", () => {
    const plan = planWithBranchTags(["SKILL_SCHNELLKRAFT"]);
    const result = migratePlanSkillTags(plan);
    expect(result?.start).toBe("2026-10-05");
    expect(result?.sections[0].trainings[0].lengths).toEqual({ SK: 20 });
    expect(result?.sections[0].trainings[0].skills.SK?.[0].branchId).toBe(
      "213",
    );
  });

  it("returns null when no plan is stored", () => {
    expect(migratePlanSkillTags(null)).toBeNull();
  });

  it("accepts a plan without sections", () => {
    const plan = { start: "2026-10-05", sections: [] } as TrainingPlanType;
    expect(migratePlanSkillTags(plan)).toEqual(plan);
  });
});
