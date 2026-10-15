import { createDataLoader, parseData } from "./createDataLoader";
import IntensityJson from "../../assets/data/generator/intensity.json";
import type { IntensityData } from "@/features/training/models/Intensity";
import { IntensityConfigSchema } from "@/schemas/intensity.schema";

const configs: Record<string, unknown> = IntensityJson;

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
