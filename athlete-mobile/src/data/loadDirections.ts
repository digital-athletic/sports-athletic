import DirectionsData from "../../assets/data/generator/directions.json";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  DirectionsByRegionSchema,
  type DirectionsByRegion,
} from "@/schemas/generator.schema";

export const parseDirections = (data: unknown): DirectionsByRegion =>
  parseData(DirectionsByRegionSchema, data, "Directions");

// The generator removes entries while drawing, so every call returns a fresh copy.
export const loadDirections = createDataLoader(
  () => parseDirections(DirectionsData),
  "clone",
);
