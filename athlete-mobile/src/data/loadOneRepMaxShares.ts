import OneRepMaxSharesData from "../../assets/data/generator/oneRepMaxShares.json";
import { createDataLoader, parseData } from "./createDataLoader";
import {
  OneRepMaxSharesSchema,
  type OneRepMaxShares,
} from "@/schemas/oneRepMaxShares.schema";

export const parseOneRepMaxShares = (data: unknown): OneRepMaxShares =>
  parseData(OneRepMaxSharesSchema, data, "OneRepMaxShares");

// Every call shares one frozen value.
export const loadOneRepMaxShares = createDataLoader(
  () => parseOneRepMaxShares(OneRepMaxSharesData),
  "frozen",
);
