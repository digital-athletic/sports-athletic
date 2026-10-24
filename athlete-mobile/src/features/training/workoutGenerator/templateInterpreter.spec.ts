import type { Template } from "@/schemas/aiwl.schema";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import type { BlockHandlerRegistry } from "./blockWalk";
import { interpretTemplate } from "./templateInterpreter";
import {
  type FilledBlockResult,
  TRAINING_DAY_FINISH_RULES,
} from "./workoutFinish";
import type { WorkoutInput } from "./workoutSetup";

/**
 * A stored training day in stored skill order, which differs from the
 * section order BR, GKS, SWR2KG, CD.
 *
 * { blocks: [SWR2KG ["79"], CD ["2"], GKS ["510"], BR ["1"]] }
 */
const STORED_TRAINING_DAY: Template = {
  aiwl: 1,
  id: "day",
  name: { en: "Day" },
  blocks: [
    { kind: "branches", skill: "SWR2KG", branches: ["79"] },
    { kind: "branches", skill: "CD", branches: ["2"] },
    { kind: "branches", skill: "GKS", branches: ["510"] },
    { kind: "branches", skill: "BR", branches: ["1"] },
  ],
};

/**
 * Stub set list builder: one entry per filled block, named by its skill.
 *
 * buildSkillSetList([BR block, GKS block]) → ["BR", "GKS"]
 */
const buildSkillSetList = (blocks: FilledBlockResult[]): string[] =>
  blocks.map((result) => result.block.skill);

describe("templateInterpreter: interpretTemplate", () => {
  it("sets the workout up once, walks the stored order and builds in section order", () => {
    const receivedInputs: WorkoutInput[] = [];
    const visits: string[] = [];
    const handlers: BlockHandlerRegistry = {
      picks: {
        usedBranchScope: "workout",
        handleBlock: (block) => ({
          status: "empty",
          block,
          reason: undefined,
          usedBranchIds: [],
        }),
      },
      branches: {
        usedBranchScope: "block",
        handleBlock: (block, input) => {
          receivedInputs.push(input);
          visits.push(block.skill);
          return {
            status: "filled",
            block,
            usedBranchIds: block.branches,
            exercises: [],
          };
        },
      },
      duration: {
        usedBranchScope: "workout",
        handleBlock: (block) => ({
          status: "empty",
          block,
          reason: undefined,
          usedBranchIds: [],
        }),
      },
    };

    const workout = interpretTemplate(
      STORED_TRAINING_DAY,
      generateRuleFamilyInput({ pains: ["KNEE_LEFT"] }),
      {
        handlers,
        finishRules: TRAINING_DAY_FINISH_RULES,
        buildSetList: buildSkillSetList,
      },
    );

    expect(visits).toEqual(["SWR2KG", "CD", "GKS", "BR"]);
    expect(receivedInputs[0].blockedRegions).toEqual(["KNEE"]);
    expect(new Set(receivedInputs).size).toBe(1);
    expect(workout.setList).toEqual(["BR", "GKS", "SWR2KG", "CD"]);
  });

  it("names the first empty skill in stored order on a day where every skill empties", () => {
    const handlers: BlockHandlerRegistry = {
      picks: {
        usedBranchScope: "workout",
        handleBlock: (block) => ({
          status: "empty",
          block,
          reason: undefined,
          usedBranchIds: [],
        }),
      },
      branches: {
        usedBranchScope: "block",
        handleBlock: (block) => ({
          status: "empty",
          block,
          reason: {
            type: "NO_EXERCISES",
            subtype: "EQUIPMENT",
            params: [`missing for ${block.skill}`],
          },
          usedBranchIds: [],
        }),
      },
      duration: {
        usedBranchScope: "workout",
        handleBlock: (block) => ({
          status: "empty",
          block,
          reason: undefined,
          usedBranchIds: [],
        }),
      },
    };

    expect(() =>
      interpretTemplate(STORED_TRAINING_DAY, generateRuleFamilyInput(), {
        handlers,
        finishRules: TRAINING_DAY_FINISH_RULES,
        buildSetList: buildSkillSetList,
      }),
    ).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: ["missing for SWR2KG"],
      }),
    );
  });
});
