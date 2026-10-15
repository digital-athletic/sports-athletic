import RegionsData from "../../assets/data/generator/regions.json";
import RegionMAX from "../../assets/data/generator/regions/MAX";
import RegionSA from "../../assets/data/generator/regions/SA";
import RegionSAKG from "../../assets/data/generator/regions/SAKG";
import RegionSK from "../../assets/data/generator/regions/SK";
import RegionSKKG from "../../assets/data/generator/regions/SKKG";
import RegionSWR1 from "../../assets/data/generator/regions/SWR1";
import RegionSWR1KG from "../../assets/data/generator/regions/SWR1KG";
import RegionSWR2KG from "../../assets/data/generator/regions/SWR2KG";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  RegionConfigSchema,
  type RegionConfig,
} from "@/schemas/generator.schema";

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

export const parseRegionConfig = (data: unknown, name: string): RegionConfig =>
  parseData(RegionConfigSchema, data, `Region configuration ${name}`);

const loaders = new Map<string, () => RegionConfig>();

// Validates each configuration once and returns a fresh copy, so callers may change it.
export const loadRegionConfig = (name: string): RegionConfig => {
  let loader = loaders.get(name);
  if (!loader) {
    const data = jsonConfigs[name] ?? codeConfigs[name];
    if (data === undefined) {
      throw new Error(`Unknown region configuration: ${name}`);
    }
    loader = createDataLoader(() => parseRegionConfig(data, name), "clone");
    loaders.set(name, loader);
  }
  return loader();
};
