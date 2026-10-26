import {
  BACK_REGION_IDS,
  FRONT_REGION_IDS,
} from "@/bodyParts/silhouette/regionMapping";
import { SILHOUETTES } from "@/bodyParts/silhouette/silhouetteData";
import {
  distinctFills,
  SELECTED_FILL,
  UNSELECTED_FILL,
} from "@/bodyParts/silhouette/svgTestUtils";
import {
  type SilhouetteGender,
  type SilhouetteRegionId,
} from "@/bodyParts/silhouette/types";
import { type Side } from "@/bodyParts/types";
import { useUserProfileStore } from "@/store/userProfileStore";
import { render, screen } from "@/utils/testUtils";
import { MusclesList } from "./MusclesList";

type TestNode = ReturnType<typeof screen.getByTestId>;

function setGender(gender: "MALE" | "FEMALE") {
  useUserProfileStore.setState({
    personalData: {
      ...useUserProfileStore.getState().personalData,
      gender,
    },
  });
}

function regionPaths(
  gender: SilhouetteGender,
  side: Side,
  id: SilhouetteRegionId,
) {
  const region = SILHOUETTES[gender][side].regions.find(
    (candidate) => candidate.id === id,
  );
  if (!region) {
    throw new Error(`Expected region ${id} on ${gender} ${side}`);
  }
  return region.paths;
}

function renderedRegionPaths(side: "front" | "back", id: SilhouetteRegionId) {
  return screen
    .getAllByTestId(`exercise-silhouette-${side}-region-${id}`, {
      includeHiddenElements: true,
    })
    .map((node) => node.props.d as string);
}

function directChildIndex(ancestor: TestNode, node: TestNode): number {
  let current: TestNode | null = node;
  while (current && current.parent !== ancestor) {
    current = current.parent;
  }
  if (!current) {
    throw new Error("Node does not sit inside the ancestor");
  }
  return ancestor.children.indexOf(current);
}

beforeEach(() => {
  setGender("MALE");
});

describe("MusclesList: silhouette highlighting", () => {
  it("highlights both glute regions on the back silhouette for a glutes exercise", async () => {
    await render(<MusclesList tags={["MUSCLE_GLUTES"]} />);

    expect(
      distinctFills("exercise-silhouette-back-region-GLUTES_LEFT"),
    ).toEqual([SELECTED_FILL]);
    expect(
      distinctFills("exercise-silhouette-back-region-GLUTES_RIGHT"),
    ).toEqual([SELECTED_FILL]);
    expect(distinctFills("exercise-silhouette-front-region-CHEST")).toEqual([
      UNSELECTED_FILL,
    ]);
  });

  it("renders the silhouette pair above the primary legend", async () => {
    await render(<MusclesList tags={["MUSCLE_GLUTES"]} />);

    const section = screen.getByTestId("muscles-trained-section");
    const pairIndex = directChildIndex(
      section,
      screen.getByTestId("exercise-silhouette-front", {
        includeHiddenElements: true,
      }),
    );
    const legendIndex = directChildIndex(
      section,
      screen.getByText("Active working muscles"),
    );

    expect(pairIndex).toBeLessThan(legendIndex);
  });
});

describe("MusclesList: cardio only exercise", () => {
  it("renders an unhighlighted pair for a cardio only exercise", async () => {
    await render(<MusclesList tags={["MUSCLE_CARDIO"]} />);

    const sides: ["front" | "back", readonly SilhouetteRegionId[]][] = [
      ["front", FRONT_REGION_IDS],
      ["back", BACK_REGION_IDS],
    ];
    const highlighted = sides.flatMap(([side, ids]) =>
      ids
        .filter(
          (id) =>
            JSON.stringify(
              distinctFills(`exercise-silhouette-${side}-region-${id}`),
            ) !== JSON.stringify([UNSELECTED_FILL]),
        )
        .map((id) => `${side} ${id}`),
    );

    expect(highlighted).toEqual([]);
    expect(
      screen.queryAllByRole("checkbox", { includeHiddenElements: true }),
    ).toHaveLength(0);
  });
});

describe("MusclesList: muscle chips", () => {
  it("renders the muscle chips with unchanged labels and order", async () => {
    await render(
      <MusclesList
        tags={[
          "MUSCLE_GLUTES",
          "MUSCLE_HAMSTRINGS",
          "MUSCLE_QUADRICEPS",
          "MUSCLE_LOWER_BACK",
        ]}
      />,
    );

    const chipLabels = screen
      .getAllByText(
        /^(buttock|left back thigh|right back thigh|left front thigh|right front thigh|lower back)$/,
      )
      .map((node) => node.props.children);

    expect(chipLabels).toEqual([
      "buttock",
      "left back thigh",
      "right back thigh",
      "left front thigh",
      "right front thigh",
      "lower back",
    ]);
  });
});

describe("MusclesList: gender selection", () => {
  it("renders the male silhouette artwork for a male profile", async () => {
    await render(<MusclesList tags={["MUSCLE_CHEST"]} />);

    expect(renderedRegionPaths("front", "CHEST")).toEqual(
      regionPaths("MALE", "FRONT", "CHEST"),
    );
  });

  it("renders the female silhouette artwork for a female profile", async () => {
    setGender("FEMALE");
    await render(<MusclesList tags={["MUSCLE_CHEST"]} />);

    expect(renderedRegionPaths("front", "CHEST")).toEqual(
      regionPaths("FEMALE", "FRONT", "CHEST"),
    );
  });
});

describe("MusclesList: region testID isolation", () => {
  it("gives the front and back silhouettes distinct region testIDs", async () => {
    await render(<MusclesList tags={["MUSCLE_NECK"]} />);

    expect(renderedRegionPaths("front", "NECK")).toHaveLength(
      regionPaths("MALE", "FRONT", "NECK").length,
    );
    expect(renderedRegionPaths("back", "NECK")).toHaveLength(
      regionPaths("MALE", "BACK", "NECK").length,
    );
  });
});
