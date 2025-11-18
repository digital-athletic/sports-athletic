import { type BodyPartData } from "@/bodyParts/types";
import { render } from "@/utils/testUtils";
import { ActiveTags } from "./ActiveTags";

const mockBodyParts: BodyPartData[] = [
  {
    name: "WADE_RECHTS",
    width: 0.13,
    height: 0.2,
    top: 0.69,
    right: 0.28,
    transform: [{ rotate: "-10deg" }],
    backgroundColor: "rgba(0,0,0,0)",
    image: require("../../../assets/img/bodyparts/muscle_m_back/wade_re.png"),
    secondaryImage: require("../../../assets/img/bodyparts/muscle_m_back/wade_re.png"),
  },
  {
    name: "WADE_LINKS",
    width: 0.13,
    height: 0.2,
    top: 0.69,
    left: 0.32,
    backgroundColor: "rgba(0,0,0,0)",
    image: require("../../../assets/img/bodyparts/muscle_m_back/wade_li.png"),
    secondaryImage: require("../../../assets/img/bodyparts/muscle_m_back/wade_li.png"),
  },
  {
    name: "OBERSCHENKEL_HINTEN_RECHTS",
    width: 0.11,
    height: 0.15,
    top: 0.54,
    right: 0.367,
    transform: [{ rotate: "-16deg" }],
    backgroundColor: "rgba(0,0,0,0)",
    image: require("../../../assets/img/bodyparts/muscle_m_back/oberschenkel_re.png"),
    secondaryImage: require("../../../assets/img/bodyparts/muscle_m_back/oberschenkel_re.png"),
  },
];

describe("<ActiveTags />", () => {
  const defaultProps = {
    tags: [],
    secondaryTags: [],
    width: 300,
    height: 400,
    availableTags: mockBodyParts,
  };

  it("renders component", () => {
    const { toJSON } = render(<ActiveTags {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with given dimensions", () => {
    const tree = render(
      <ActiveTags {...defaultProps} width={500} height={600} />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it("renders primary muscle images for matching tags", () => {
    const { getAllByLabelText } = render(
      <ActiveTags {...defaultProps} tags={["WADE_RECHTS", "WADE_LINKS"]} />
    );

    const primaryMuscles = getAllByLabelText("Primary muscle:", {
      exact: false,
    });
    expect(primaryMuscles).toHaveLength(2);
  });

  it("renders secondary muscle images for matching secondaryTags", () => {
    const { getAllByLabelText } = render(
      <ActiveTags {...defaultProps} secondaryTags={["WADE_RECHTS"]} />
    );

    const secondaryMuscles = getAllByLabelText("Secondary muscle:", {
      exact: false,
    });
    expect(secondaryMuscles).toHaveLength(1);
  });

  it("renders both primary and secondary muscle images", () => {
    const { getAllByLabelText } = render(
      <ActiveTags
        {...defaultProps}
        tags={["WADE_RECHTS"]}
        secondaryTags={["WADE_LINKS", "OBERSCHENKEL_HINTEN_RECHTS"]}
      />
    );

    const primaryMuscles = getAllByLabelText("Primary muscle:", {
      exact: false,
    });
    const secondaryMuscles = getAllByLabelText("Secondary muscle:", {
      exact: false,
    });

    expect(primaryMuscles).toHaveLength(1);
    expect(secondaryMuscles).toHaveLength(2);
  });

  it("does not render any images when no tags match", () => {
    const { queryByLabelText } = render(
      <ActiveTags {...defaultProps} tags={["nonexistent"]} />
    );

    expect(queryByLabelText("Primary muscle:", { exact: false })).toBeNull();
  });

  it("renders the same muscle as both primary and secondary if in both tag arrays", () => {
    const { getAllByLabelText } = render(
      <ActiveTags
        {...defaultProps}
        tags={["WADE_RECHTS"]}
        secondaryTags={["WADE_RECHTS"]}
      />
    );

    // Should render both primary and secondary images for biceps
    const primaryMuscles = getAllByLabelText("Primary muscle: WADE_RECHTS");
    const secondaryMuscles = getAllByLabelText("Secondary muscle: WADE_RECHTS");

    expect(primaryMuscles).toHaveLength(1);
    expect(secondaryMuscles).toHaveLength(1);
  });

  it("handles empty availableTags array", () => {
    const { toJSON } = render(
      <ActiveTags {...defaultProps} availableTags={[]} tags={["WADE_RECHTS"]} />
    );

    expect(toJSON()).toBeTruthy();
  });

  it("handles empty tags and secondaryTags arrays", () => {
    const { queryByLabelText } = render(
      <ActiveTags {...defaultProps} tags={[]} secondaryTags={[]} />
    );

    expect(queryByLabelText("Primary muscle:", { exact: false })).toBeNull();
    expect(queryByLabelText("Secondary muscle:", { exact: false })).toBeNull();
  });

  it("renders all available tags when all are marked as primary", () => {
    const { getAllByLabelText } = render(
      <ActiveTags
        {...defaultProps}
        tags={["WADE_RECHTS", "WADE_LINKS", "OBERSCHENKEL_HINTEN_RECHTS"]}
      />
    );

    const primaryMuscles = getAllByLabelText("Primary muscle:", {
      exact: false,
    });
    expect(primaryMuscles).toHaveLength(3);
  });
});
