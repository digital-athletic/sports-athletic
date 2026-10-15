import RegionsData from "../../assets/data/generator/regions.json";
import RegionMAX from "../../assets/data/generator/regions/MAX";
import RegionSA from "../../assets/data/generator/regions/SA";
import RegionSAKG from "../../assets/data/generator/regions/SAKG";
import RegionSK from "../../assets/data/generator/regions/SK";
import RegionSKKG from "../../assets/data/generator/regions/SKKG";
import RegionSWR1 from "../../assets/data/generator/regions/SWR1";
import RegionSWR1KG from "../../assets/data/generator/regions/SWR1KG";
import RegionSWR2KG from "../../assets/data/generator/regions/SWR2KG";
import {
  RegionConfigSchema,
  type RegionConfig,
} from "@/schemas/generator.schema";
import { cloneWithValidation } from "@/utils/cloneWithValidation";

const jsonConfigs: Record<string, unknown> = RegionsData;

// Strength configs move to regions.json in a later step.
const codeConfigs: Record<string, unknown> = {
  MAX: RegionMAX,
  SA: RegionSA,
  SAKG: RegionSAKG,
  SK: RegionSK,
  SKKG: RegionSKKG,
  SWR1: RegionSWR1,
  SWR1KG: RegionSWR1KG,
  SWR2KG: RegionSWR2KG,
};

// Returns a fresh validated copy, so callers may change it.
export const loadRegionConfig = (name: string): RegionConfig => {
  const data = jsonConfigs[name] ?? codeConfigs[name];
  if (data === undefined) {
    throw new Error(`Unknown region configuration: ${name}`);
  }
  return cloneWithValidation(
    data,
    RegionConfigSchema,
    `Region configuration ${name}`,
  );
};
