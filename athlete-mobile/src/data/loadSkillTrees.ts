import * as v from "valibot";
import { transformSkillTree } from "@/utils/skillTreeTransform";
import {
  SkillTreeSchema,
  type SkillTreeType,
} from "@/schemas/skillTree.schema";
import type { SkillTree } from "@/constants/workoutConstants";

import BAS from "../../assets/data/generator/skillTrees/BAS.json";
import BR from "../../assets/data/generator/skillTrees/BR.json";
import CARDIO_1_LAKTAT from "../../assets/data/generator/skillTrees/CARDIO_1_LAKTAT.json";
import CARDIO_1_SHORT from "../../assets/data/generator/skillTrees/CARDIO_1_SHORT.json";
import CARDIO_2 from "../../assets/data/generator/skillTrees/CARDIO_2.json";
import CARDIO_3 from "../../assets/data/generator/skillTrees/CARDIO_3.json";
import CARDIO_4 from "../../assets/data/generator/skillTrees/CARDIO_4.json";
import CARDIO_5 from "../../assets/data/generator/skillTrees/CARDIO_5.json";
import CD from "../../assets/data/generator/skillTrees/CD.json";
import GKS from "../../assets/data/generator/skillTrees/GKS.json";
import GKSKG from "../../assets/data/generator/skillTrees/GKSKG.json";
import MAX from "../../assets/data/generator/skillTrees/MAX.json";
import MOB from "../../assets/data/generator/skillTrees/MOB.json";
import PLYO from "../../assets/data/generator/skillTrees/PLYO.json";
import PREV from "../../assets/data/generator/skillTrees/PREV.json";
import PREVKG from "../../assets/data/generator/skillTrees/PREVKG.json";
import SA from "../../assets/data/generator/skillTrees/SA.json";
import SAKG from "../../assets/data/generator/skillTrees/SAKG.json";
import SASPEZIAL from "../../assets/data/generator/skillTrees/SASPEZIAL.json";
import SK from "../../assets/data/generator/skillTrees/SK.json";
import SKKG from "../../assets/data/generator/skillTrees/SKKG.json";
import SUPPORT from "../../assets/data/generator/skillTrees/SUPPORT.json";
import SWR1 from "../../assets/data/generator/skillTrees/SWR1.json";
import SWR1KG from "../../assets/data/generator/skillTrees/SWR1KG.json";
import WU from "../../assets/data/generator/skillTrees/WU.json";
import WUSKSA from "../../assets/data/generator/skillTrees/WUSKSA.json";
import WUSPEZIAL from "../../assets/data/generator/skillTrees/WUSPEZIAL.json";

const SKILL_TREE_MAP: Record<SkillTree, unknown> = {
  BAS,
  BR,
  CARDIO_1_LAKTAT,
  CARDIO_1_SHORT,
  CARDIO_2,
  CARDIO_3,
  CARDIO_4,
  CARDIO_5,
  CD,
  GKS,
  GKSKG,
  MAX,
  MOB,
  PLYO,
  PREV,
  PREVKG,
  SA,
  SAKG,
  SASPEZIAL,
  SK,
  SKKG,
  SUPPORT,
  SWR1,
  SWR1KG,
  WU,
  WUSKSA,
  WUSPEZIAL,
};

export const loadSkillTree = (skillName: SkillTree): SkillTreeType => {
  const rawData = SKILL_TREE_MAP[skillName];
  if (!rawData) {
    throw new Error(`Unknown skill tree: ${skillName}`);
  }

  const transformed = transformSkillTree(
    rawData as Parameters<typeof transformSkillTree>[0],
  );
  const result = v.safeParse(SkillTreeSchema, transformed);

  if (!result.success) {
    console.error(
      `Skill tree '${skillName}' validation failed:`,
      v.flatten(result.issues),
    );
    throw new Error(`Skill tree validation failed: ${skillName}`);
  }

  return result.output;
};
