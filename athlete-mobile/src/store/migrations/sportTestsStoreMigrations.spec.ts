import { generateSportTest } from "@test/factories/sportTest";
import { useSportTestsStore } from "../sportTestsStore";
import { STORE_VERSIONS } from "../storeVersions";

type TestWithoutTranslations = Omit<
  ReturnType<typeof generateSportTest>,
  "translations"
>;

/** A test as the v14 cache stored it, without the translations field. */
const generateV14Test = (code: string): TestWithoutTranslations => {
  const { id, unit, referenceValues } = generateSportTest(code);
  return { id, code, unit, referenceValues };
};

const migrate = async (persisted: unknown, fromVersion: number) => {
  const migrateFn = useSportTestsStore.persist.getOptions().migrate;
  if (!migrateFn) throw new Error("sportTestsStore has no migrate function");
  return migrateFn(persisted, fromVersion);
};

describe("sportTestsStore migrations", () => {
  describe("v14 to v15: adds translations", () => {
    it("is version 15", () => {
      expect(STORE_VERSIONS.SPORT_TESTS).toBe(15);
    });

    it("gives a cached test without translations an empty translations object", async () => {
      const persisted = {
        testsBySport: { SPORT_HANDBALL: [generateV14Test("FAKE_TEST_A")] },
      };

      const result = await migrate(persisted, 14);

      expect(result).toEqual({
        testsBySport: {
          SPORT_HANDBALL: [generateSportTest("FAKE_TEST_A")],
        },
      });
    });

    it("migrates the tests of every cached sport", async () => {
      const persisted = {
        testsBySport: {
          SPORT_HANDBALL: [generateV14Test("FAKE_TEST_A")],
          SPORT_FOOTBALL: [
            generateV14Test("FAKE_TEST_B"),
            generateV14Test("FAKE_TEST_C"),
          ],
        },
      };

      const result = await migrate(persisted, 14);

      expect(result).toEqual({
        testsBySport: {
          SPORT_HANDBALL: [generateSportTest("FAKE_TEST_A")],
          SPORT_FOOTBALL: [
            generateSportTest("FAKE_TEST_B"),
            generateSportTest("FAKE_TEST_C"),
          ],
        },
      });
    });

    it("keeps the translations of a test that already has them", async () => {
      const translated = generateSportTest("FAKE_TEST_A", [], {
        en: { name: "Fake test" },
      });

      const result = await migrate(
        { testsBySport: { SPORT_HANDBALL: [translated] } },
        14,
      );

      expect(result).toEqual({
        testsBySport: { SPORT_HANDBALL: [translated] },
      });
    });
  });
});
