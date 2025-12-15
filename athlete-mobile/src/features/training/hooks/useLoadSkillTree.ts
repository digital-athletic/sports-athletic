import { SkillTree } from "@/constants/workoutConstants";
import { useSkillTreesStore } from "@/store/skillTreesStore";
import BAS from "../../../../assets/data/generator/skillTrees/BAS.json";
import BR from "../../../../assets/data/generator/skillTrees/BR.json";
import CARDIO_1_LAKTAT from "../../../../assets/data/generator/skillTrees/CARDIO_1_LAKTAT.json";
import CARDIO_1_SHORT from "../../../../assets/data/generator/skillTrees/CARDIO_1_SHORT.json";
import CARDIO_2 from "../../../../assets/data/generator/skillTrees/CARDIO_2.json";
import CARDIO_3 from "../../../../assets/data/generator/skillTrees/CARDIO_3.json";
import CARDIO_4 from "../../../../assets/data/generator/skillTrees/CARDIO_4.json";
import CARDIO_5 from "../../../../assets/data/generator/skillTrees/CARDIO_5.json";
import CD from "../../../../assets/data/generator/skillTrees/CD.json";
import GKS from "../../../../assets/data/generator/skillTrees/GKS.json";
import GKSKG from "../../../../assets/data/generator/skillTrees/GKSKG.json";
import MAX from "../../../../assets/data/generator/skillTrees/MAX.json";
import MOB from "../../../../assets/data/generator/skillTrees/MOB.json";
import PLYO from "../../../../assets/data/generator/skillTrees/PLYO.json";
import PREV from "../../../../assets/data/generator/skillTrees/PREV.json";
import PREVKG from "../../../../assets/data/generator/skillTrees/PREVKG.json";
import SA from "../../../../assets/data/generator/skillTrees/SA.json";
import SAKG from "../../../../assets/data/generator/skillTrees/SAKG.json";
import SASPEZIAL from "../../../../assets/data/generator/skillTrees/SASPEZIAL.json";
import SK from "../../../../assets/data/generator/skillTrees/SK.json";
import SKKG from "../../../../assets/data/generator/skillTrees/SKKG.json";
import SUPPORT from "../../../../assets/data/generator/skillTrees/SUPPORT.json";
import SWR1 from "../../../../assets/data/generator/skillTrees/SWR1.json";
import SWR1KG from "../../../../assets/data/generator/skillTrees/SWR1KG.json";
import WU from "../../../../assets/data/generator/skillTrees/WU.json";
import WUSKSA from "../../../../assets/data/generator/skillTrees/WUSKSA.json";
import WUSPEZIAL from "../../../../assets/data/generator/skillTrees/WUSPEZIAL.json";

const loadSkillTree = (skillName: SkillTree) => {
  switch (skillName) {
    case "BAS":
      return BAS;
    case "BR":
      return BR;
    case "CARDIO_1_LAKTAT":
      return CARDIO_1_LAKTAT;
    case "CARDIO_1_SHORT":
      return CARDIO_1_SHORT;
    case "CARDIO_2":
      return CARDIO_2;
    case "CARDIO_3":
      return CARDIO_3;
    case "CARDIO_4":
      return CARDIO_4;
    case "CARDIO_5":
      return CARDIO_5;
    case "CD":
      return CD;
    case "GKS":
      return GKS;
    case "GKSKG":
      return GKSKG;
    case "MAX":
      return MAX;
    case "MOB":
      return MOB;
    case "PLYO":
      return PLYO;
    case "PREV":
      return PREV;
    case "PREVKG":
      return PREVKG;
    case "SA":
      return SA;
    case "SAKG":
      return SAKG;
    case "SASPEZIAL":
      return SASPEZIAL;
    case "SK":
      return SK;
    case "SKKG":
      return SKKG;
    case "SUPPORT":
      return SUPPORT;
    case "SWR1":
      return SWR1;
    case "SWR1KG":
      return SWR1KG;
    case "WU":
      return WU;
    case "WUSKSA":
      return WUSKSA;
    case "WUSPEZIAL":
      return WUSPEZIAL;
    default:
      throw new Error(`Unknown skill tree: ${skillName}`);
  }
};

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
