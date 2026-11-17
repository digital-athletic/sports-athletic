import IconBarbell from "@tabler/icons-react-native/IconBarbell";
import IconBolt from "@tabler/icons-react-native/IconBolt";
import IconHeartbeat from "@tabler/icons-react-native/IconHeartbeat";
import IconRun from "@tabler/icons-react-native/IconRun";
import IconStopwatch from "@tabler/icons-react-native/IconStopwatch";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { type AppIconSource } from "@/common/AppIcon";
import { type SportTest } from "./models/SportTest";

type KnownCategory = {
  code: string;
  icon: AppIconSource;
  /** Suffix of the testID of the icon, e.g. "run" gives performance-test-icon-run. */
  iconName: string;
};

/** The known categories in their display order. */
const KNOWN_CATEGORIES: readonly KnownCategory[] = [
  { code: "SPEED", icon: IconRun, iconName: "run" },
  { code: "EXPLOSIVE_POWER", icon: IconBolt, iconName: "bolt" },
  { code: "MAXIMUM_STRENGTH", icon: IconBarbell, iconName: "barbell" },
  { code: "ENDURANCE", icon: IconHeartbeat, iconName: "heartbeat" },
];

const UNKNOWN_ICON_NAME = "stopwatch";

const findKnownCategory = (
  category: string | undefined,
): KnownCategory | undefined =>
  KNOWN_CATEGORIES.find((known) => known.code === category);

/** The icon of a test category, the stopwatch for an unknown or missing category. */
export function categoryIcon(category: string | undefined): AppIconSource {
  return findKnownCategory(category)?.icon ?? IconStopwatch;
}

/** The testID suffix of the category icon, "stopwatch" for an unknown or missing category. */
export function categoryIconName(category: string | undefined): string {
  return findKnownCategory(category)?.iconName ?? UNKNOWN_ICON_NAME;
}

/** The translated name of a category, or the code when there is no translation. */
export function resolveCategoryLabel(category: string, t: TFunction): string {
  // Only known codes are looked up, so "." or ":" in an unknown code cannot hit another key or namespace.
  if (findKnownCategory(category) === undefined) return category;

  return t(`more.performanceTests.categories.${category}`, {
    defaultValue: category,
  });
}

/** The translated name of a category in the athlete's language, or undefined for a missing category. */
export function useCategoryLabel(
  category: string | undefined,
): string | undefined {
  const { t } = useTranslation();

  return category === undefined ? undefined : resolveCategoryLabel(category, t);
}

const displayRank = (category: string): number => {
  const known = findKnownCategory(category);
  return known ? KNOWN_CATEGORIES.indexOf(known) : KNOWN_CATEGORIES.length;
};

/** The distinct categories of the tests, known ones first in their display order. Tests without a category add none. */
export function categoriesOfTests(tests: SportTest[]): string[] {
  const categories = tests.flatMap((test) =>
    test.category === undefined ? [] : [test.category],
  );
  const distinct = [...new Set(categories)];

  return distinct.sort((a, b) => {
    const byRank = displayRank(a) - displayRank(b);
    if (byRank !== 0) return byRank;

    return a.localeCompare(b);
  });
}

/** The tests of one category in their order, or all tests for null, including those without a category. */
export function filterTestsByCategory(
  tests: SportTest[],
  category: string | null,
): SportTest[] {
  if (category === null) return tests;

  return tests.filter((test) => test.category === category);
}
