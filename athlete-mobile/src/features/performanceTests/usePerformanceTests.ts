import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { fetchSportTests } from "@/services/SportTestService";
import { useSportTestsStore } from "@/store/sportTestsStore";
import { type SportTest } from "./models/SportTest";

export type PerformanceTestsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; tests: SportTest[] };

/** Cache key of the list, which holds the tests of every sport. */
export const ALL_SPORTS_CACHE_KEY = "ALL_SPORTS";

/** Shows the cached tests at once and refreshes them on every focus. */
export function usePerformanceTests(): {
  state: PerformanceTestsState;
  reload: () => void;
} {
  const cached = useSportTestsStore(
    (state) => state.testsBySport[ALL_SPORTS_CACHE_KEY],
  );
  const setTests = useSportTestsStore((state) => state.setTests);
  const [hasFailed, setHasFailed] = useState(false);
  // Each load gets a number, so a slow earlier answer cannot overwrite a newer one.
  const latestLoad = useRef(0);

  const load = useCallback(() => {
    const loadId = ++latestLoad.current;
    const isCurrent = () => loadId === latestLoad.current;
    setHasFailed(false);
    fetchSportTests()
      .then((tests) => {
        if (isCurrent()) setTests(ALL_SPORTS_CACHE_KEY, tests);
      })
      .catch((error: unknown) => {
        console.error("Loading performance tests failed", error);
        if (isCurrent()) setHasFailed(true);
      });
  }, [setTests]);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        latestLoad.current += 1;
      };
    }, [load]),
  );

  return { state: toState(cached, hasFailed), reload: load };
}

function toState(
  cached: SportTest[] | undefined,
  hasFailed: boolean,
): PerformanceTestsState {
  if (cached) return { status: "loaded", tests: cached };
  if (hasFailed) return { status: "error" };
  return { status: "loading" };
}
