import type { MigrationMap } from "./createMigrate";
import type { State } from "../sportTestsStore";
import type { SportTest } from "@/features/performanceTests/models/SportTest";

type CachedTest = Omit<SportTest, "translations"> &
  Partial<Pick<SportTest, "translations">>;

export const sportTestsStoreMigrations: MigrationMap<State> = {
  // 14 to 15: tests carry their translations from the database.
  14: (state) => {
    const testsBySport: Partial<Record<string, CachedTest[]>> =
      state.testsBySport;
    return {
      ...state,
      testsBySport: Object.fromEntries(
        Object.entries(testsBySport).map(([sport, tests]) => [
          sport,
          tests?.map((test) => ({
            ...test,
            translations: test.translations ?? {},
          })),
        ]),
      ),
    };
  },
};
