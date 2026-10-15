import DirectionsData from "../../assets/data/generator/directions.json";
import {
  DirectionsByRegionSchema,
  type DirectionsByRegion,
} from "@/schemas/generator.schema";
import { cloneWithValidation } from "@/utils/cloneWithValidation";

// The generator removes entries while drawing, so every call returns a fresh validated copy.
export const loadDirections = (): DirectionsByRegion =>
  cloneWithValidation(DirectionsData, DirectionsByRegionSchema, "Directions");
