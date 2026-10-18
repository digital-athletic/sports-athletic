import PlacesData from "../../assets/data/generator/places.json";
import { createDataLoader, parseData } from "./createDataLoader";
import { PlacesDataSchema, type PlacesJson } from "@/schemas/generator.schema";

export const parsePlaces = (data: unknown): PlacesJson =>
  parseData(PlacesDataSchema, data, "Places");

// Stores keep and change the equipment lists, so every call returns a fresh copy.
export const loadPlaces = createDataLoader(
  () => parsePlaces(PlacesData),
  "clone",
);
