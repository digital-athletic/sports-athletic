import { useSkillTreesStore } from "@/store/skillTreesStore";
import { loadSkillTree } from "@/data/loadSkillTrees";

// TEMPORARY: hardcoded list until we have dynamic loading
const AVAILABLE_SKILL_TREES = [
  "BAS",
  "BR",
  "CARDIO_1_LAKTAT",
  "CARDIO_1_SHORT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
  "CD",
  "GKS",
  "GKSKG",
  "MAX",
  "MOB",
  "PLYO",
  "PREV",
  "PREVKG",
  "SA",
  // "SAKG", // Uncomment if SAKG is added to SkillTree type
  "SASPEZIAL",
  "SK",
  "SKKG",
  // "SUPPORT", // Uncomment if SUPPORT is added to SkillTree type
  "SWR1",
  "SWR1KG",
  "WU",
  "WUSKSA",
  "WUSPEZIAL",
] as const;

export const useLoadSkillTrees = () => {
  const setSkillTree = useSkillTreesStore((state) => state.setSkillTree);

  AVAILABLE_SKILL_TREES.forEach((skillName) => {
    const skillTreeData = loadSkillTree(skillName);
    setSkillTree(skillName, skillTreeData);
  });
};
