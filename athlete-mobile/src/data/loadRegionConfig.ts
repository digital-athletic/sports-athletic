import RegionsData from "../../assets/data/generator/regions.json";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  RegionConfigSchema,
  type RegionConfig,
} from "@/schemas/generator.schema";

const configs: Record<string, unknown> = RegionsData;

export const parseRegionConfig = (data: unknown, name: string): RegionConfig =>
  parseData(RegionConfigSchema, data, `Region configuration ${name}`);

const loaders = new Map<string, () => RegionConfig>();

// Validates each configuration once and returns a fresh copy, so callers may change it.
export const loadRegionConfig = (name: string): RegionConfig => {
  let loader = loaders.get(name);
  if (!loader) {
    const data = configs[name];
    if (data === undefined) {
      throw new Error(`Unknown region configuration: ${name}`);
    }
    loader = createDataLoader(() => parseRegionConfig(data, name), "clone");
    loaders.set(name, loader);
  }
  return loader();
};
