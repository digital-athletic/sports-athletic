import { type TileData } from "@/constants/workoutConstants";
import { type Href } from "expo-router";

/** Route of a training tile, for `router.navigate`. */
export const tileHref = ({ navigate }: TileData): Href =>
  // Typed routes reject a dynamic pathname in the object form; key is a valid Route.
  ({ pathname: navigate.key, params: navigate.params }) as Href;
