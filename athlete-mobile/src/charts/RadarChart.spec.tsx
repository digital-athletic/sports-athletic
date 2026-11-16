import type { UserSkills } from "@/features/statistics/models/WorkoutsData";
import { render } from "@/utils/testUtils";
import { RadarChart } from "./RadarChart";

// Shape of the rendered tree returned by toJSON
type RenderedNode = {
  props: Record<string, unknown>;
  children: (RenderedNode | string)[] | null;
};

jest.mock("expo-image", () => ({
  Image: "Image",
}));

// Builds skills that sum to 100: { MOBILITY: 30, PREVENTION: 25, CARDIO: 15, STABILITY: 12, WARMUP: 10, SWR: 8 }
const generateUserSkills = (
  overrides: Partial<UserSkills> = {},
): UserSkills => ({
  MOBILITY: 30,
  PREVENTION: 25,
  CARDIO: 15,
  STABILITY: 12,
  WARMUP: 10,
  SWR: 8,
  ...overrides,
});

// Collects every prop name of the rendered tree: ["testID", "points", "translateX"]
const collectPropNames = (
  node: RenderedNode | RenderedNode[] | null,
): string[] => {
  if (node === null) return [];
  if (Array.isArray(node)) return node.flatMap(collectPropNames);
  const children = (node.children ?? []).filter(
    (child): child is RenderedNode => typeof child !== "string",
  );
  return [...Object.keys(node.props), ...children.flatMap(collectPropNames)];
};

// Collects every text string of the rendered tree: ["Mobility", "30%"]
const collectTexts = (node: RenderedNode | RenderedNode[] | null): string[] => {
  if (node === null) return [];
  if (Array.isArray(node)) return node.flatMap(collectTexts);
  // react-native-svg renders text natively as a "content" prop, not as a string child
  const ownText =
    typeof node.props.content === "string" ? [node.props.content] : [];
  return [
    ...ownText,
    ...(node.children ?? []).flatMap((child) =>
      typeof child === "string" ? [child] : collectTexts(child),
    ),
  ];
};

// Parses the native path of an svg polygon into numbers: "M110 88 130 99z" becomes [[110, 88], [130, 99]]
// (react-native-svg turns the web "points" prop into a path "d" when rendering natively)
const parsePoints = (path: string): number[][] => {
  const numbers = (path.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? []).map(Number);
  return Array.from({ length: numbers.length / 2 }, (_, index) => [
    numbers[2 * index],
    numbers[2 * index + 1],
  ]);
};

describe("RadarChart: polygon points", () => {
  it("draws one polygon point per skill", async () => {
    const { getByTestId } = await render(
      <RadarChart userSkills={generateUserSkills()} />,
    );

    const points = parsePoints(getByTestId("radar-chart-polygon").props.d);

    expect(points).toHaveLength(6);
  });

  it("starts the polygon at the top and adds centerOffset to the percentage", async () => {
    const { getByTestId } = await render(
      <RadarChart userSkills={generateUserSkills()} />,
    );

    const points = parsePoints(getByTestId("radar-chart-polygon").props.d);

    // MOBILITY 30% + 10 = 40 of 50 on the 88 grid radius straight up from center (88, 88)
    expect(points[0][0]).toBeCloseTo(88);
    expect(points[0][1]).toBeCloseTo(88 - 0.8 * 88);
  });

  it("caps the radius at maxValue (50) when percentage plus offset exceeds it", async () => {
    const { getByTestId } = await render(
      <RadarChart
        userSkills={generateUserSkills({
          MOBILITY: 80,
          PREVENTION: 5,
          CARDIO: 5,
          STABILITY: 5,
          WARMUP: 3,
          SWR: 2,
        })}
      />,
    );

    const points = parsePoints(getByTestId("radar-chart-polygon").props.d);

    expect(points[0][0]).toBeCloseTo(88);
    expect(points[0][1]).toBeCloseTo(0);
  });

  it("applies only the centerOffset when all skills are zero", async () => {
    const { getByTestId } = await render(
      <RadarChart
        userSkills={generateUserSkills({
          MOBILITY: 0,
          PREVENTION: 0,
          CARDIO: 0,
          STABILITY: 0,
          WARMUP: 0,
          SWR: 0,
        })}
      />,
    );

    const points = parsePoints(getByTestId("radar-chart-polygon").props.d);

    // value 10 of 50 is a radius of 17.6 around the center (88, 88)
    points.forEach(([x, y]) => {
      expect(Math.hypot(x - 88, y - 88)).toBeCloseTo(17.6);
    });
  });
});

describe("RadarChart: labels", () => {
  it("renders the skill name and percentage for each of the 6 skills", async () => {
    const { toJSON } = await render(
      <RadarChart userSkills={generateUserSkills()} />,
    );

    const texts = collectTexts(toJSON());

    [
      "Mobility",
      "30%",
      "Prevention",
      "25%",
      "Endurance",
      "15%",
      "Stability",
      "12%",
      "Warm-up",
      "10%",
      "Strength",
      "8%",
    ].forEach((expected) => {
      expect(texts).toContain(expected);
    });
  });

  it("rounds the percentage to a whole number", async () => {
    const { toJSON } = await render(
      <RadarChart
        userSkills={generateUserSkills({
          MOBILITY: 1,
          PREVENTION: 2,
          CARDIO: 2,
          STABILITY: 2,
          WARMUP: 2,
          SWR: 2,
        })}
      />,
    );

    const texts = collectTexts(toJSON());

    // 1 of 11 is 9.09 percent and 2 of 11 is 18.18 percent
    expect(texts).toContain("9%");
    expect(texts).toContain("18%");
  });
});

describe("RadarChart: screen reader summary", () => {
  it("labels the chart with every skill and its percentage", async () => {
    const { getByTestId } = await render(
      <RadarChart userSkills={generateUserSkills()} />,
    );

    expect(getByTestId("radar-chart-container").props.accessibilityLabel).toBe(
      "Skill profile: Mobility 30%, Prevention 25%, Endurance 15%, Stability 12%, Warm-up 10%, Strength 8%",
    );
  });
});

describe("RadarChart: web safe props", () => {
  it.each(["translateX", "translateY", "collapsable"])(
    "does not pass %s to any element",
    async (propName) => {
      const { toJSON } = await render(
        <RadarChart userSkills={generateUserSkills()} />,
      );

      expect(collectPropNames(toJSON())).not.toContain(propName);
    },
  );
});
