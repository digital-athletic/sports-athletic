import * as v from "valibot";
import IntensityJson from "../../assets/data/generator/intensity.json";
import { IntensityBAS } from "../../assets/data/generator/intensity/BAS";
import {
  IntensityGKS,
  IntensityGKS_KG,
} from "../../assets/data/generator/intensity/GKS";
import { IntensityPREV } from "../../assets/data/generator/intensity/PREV";
import { IntensitySA } from "../../assets/data/generator/intensity/SA";
import { IntensitySA_KG } from "../../assets/data/generator/intensity/SAKG";
import { IntensitySK } from "../../assets/data/generator/intensity/SK";
import { IntensitySK_KG } from "../../assets/data/generator/intensity/SKKG";
import { IntensitySWR_2 } from "../../assets/data/generator/intensity/SWR2";
import { IntensitySWR_2_KG } from "../../assets/data/generator/intensity/SWR2KG";
import type { IntensityData } from "@/features/training/models/Intensity";
import { IntensityConfigSchema } from "@/schemas/intensity.schema";

// Configs that have not moved to intensity.json yet.
const codeConfigs: Record<string, unknown> = {
  BAS: IntensityBAS,
  GKS: IntensityGKS,
  GKSKG: IntensityGKS_KG,
  PREV: IntensityPREV,
  SA: IntensitySA,
  SAKG: IntensitySA_KG,
  SK: IntensitySK,
  SKKG: IntensitySK_KG,
  SWR2: IntensitySWR_2,
  SWR2KG: IntensitySWR_2_KG,
};

const configs: Record<string, unknown> = { ...codeConfigs, ...IntensityJson };

const deepFreeze = (value: unknown): void => {
  if (typeof value === "object" && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
};

// Validated once per name. Callers share the frozen result.
const validated = new Map<string, IntensityData>();

export const loadIntensityConfig = (name: string): IntensityData => {
  const cached = validated.get(name);
  if (cached) {
    return cached;
  }
  const data = configs[name];
  if (data === undefined) {
    throw new Error(`Unknown intensity configuration: ${name}`);
  }
  const copy: unknown = structuredClone(data);
  if (!v.is(IntensityConfigSchema, copy)) {
    const result = v.safeParse(IntensityConfigSchema, copy);
    console.error(
      `Validation failed for intensity configuration ${name}:`,
      result.issues ? v.flatten(result.issues) : undefined,
    );
    throw new Error(
      `Invalid data structure for intensity configuration ${name}`,
    );
  }
  // The copy keeps the key order of the source, which the output snapshots rely on.
  deepFreeze(copy);
  validated.set(name, copy);
  return copy;
};
