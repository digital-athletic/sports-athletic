import { Redirect } from "expo-router";

/** The bare /training route has no screen. A new training starts at /training/new. */
export default function TrainingIndex() {
  return <Redirect href="/(tabs)/(home)" />;
}
