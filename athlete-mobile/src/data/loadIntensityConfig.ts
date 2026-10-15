import { createDataLoader, parseData } from "./createDataLoader";
import IntensityJson from "../../assets/data/generator/intensity.json";
import { IntensitySA } from "../../assets/data/generator/intensity/SA";
import { IntensitySA_KG } from "../../assets/data/generator/intensity/SAKG";
import { IntensitySWR_2 } from "../../assets/data/generator/intensity/SWR2";
import { IntensitySWR_2_KG } from "../../assets/data/generator/intensity/SWR2KG";
import type { IntensityData } from "@/features/training/models/Intensity";
import { IntensityConfigSchema } from "@/schemas/intensity.schema";

// Configs that have not moved to intensity.json yet.
const codeConfigs: Record<string, unknown> = {
  SA: IntensitySA,
  SAKG: IntensitySA_KG,
  SWR2: IntensitySWR_2,
  SWR2KG: IntensitySWR_2_KG,
};

const configs: Record<string, unknown> = { ...codeConfigs, ...IntensityJson };

export const parseIntensityConfig = (
  name: string,
  data: unknown,
): IntensityData =>
  parseData(IntensityConfigSchema, data, `intensity configuration ${name}`);

// One loader per name: validated once, callers share the deep frozen result.
const loaders = new Map<string, () => IntensityData>();

export const loadIntensityConfig = (name: string): IntensityData => {
  let loader = loaders.get(name);
  if (!loader) {
    const data = configs[name];
    if (data === undefined) {
      throw new Error(`Unknown intensity configuration: ${name}`);
    }
    loader = createDataLoader(() => parseIntensityConfig(name, data), "frozen");
    loaders.set(name, loader);
  }
  return loader();
};
