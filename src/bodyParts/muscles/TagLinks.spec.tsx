import { type BodyPartData } from "@/bodyParts/types";
import { fireEvent, render } from "@/utils/testUtils";
import { TagLinks, TagLinksProps } from "./TagLinks";

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

describe("<TagLinks />", () => {
  const props: TagLinksProps = {
    onMuscleLinkClick: jest.fn(),
    width: 300,
    height: 400,
    availableTags: mockBodyParts,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders component", () => {
    const { toJSON } = render(<TagLinks {...props} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders a button for each available tag", () => {
    const { getAllByRole } = render(<TagLinks {...props} />);
    const buttons = getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("calls onMuscleLinkClick with muscle name when link is pressed", () => {
    const mockClick = jest.fn();
    const { getByLabelText } = render(
      <TagLinks {...props} onMuscleLinkClick={mockClick} />
    );

    const calfRightLink = getByLabelText("Select WADE_RECHTS muscle");
    fireEvent.press(calfRightLink);

    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledWith("WADE_RECHTS");
  });

  it("calls onMuscleLinkClick with correct muscle name for each link", () => {
    const mockClick = jest.fn();
    const { getByLabelText } = render(
      <TagLinks {...props} onMuscleLinkClick={mockClick} />
    );

    fireEvent.press(getByLabelText("Select WADE_RECHTS muscle"));
    expect(mockClick).toHaveBeenLastCalledWith("WADE_RECHTS");

    fireEvent.press(getByLabelText("Select WADE_LINKS muscle"));
    expect(mockClick).toHaveBeenLastCalledWith("WADE_LINKS");

    fireEvent.press(getByLabelText("Select OBERSCHENKEL_HINTEN_RECHTS muscle"));
    expect(mockClick).toHaveBeenLastCalledWith("OBERSCHENKEL_HINTEN_RECHTS");
    expect(mockClick).toHaveBeenCalledTimes(3);
  });

  it("renders buttons with correct accessibility role", () => {
    const { getAllByRole } = render(<TagLinks {...props} />);
    const buttons = getAllByRole("button");

    buttons.forEach((button) => {
      expect(button.props.accessibilityRole).toBe("button");
    });
  });

  it("handles empty availableTags array", () => {
    const { toJSON, queryByRole } = render(
      <TagLinks {...props} availableTags={[]} />
    );

    expect(toJSON()).toBeTruthy();
    expect(queryByRole("button")).toBeNull();
  });

  it("handles single tag", () => {
    const singleTag = [mockBodyParts[0]];
    const { getAllByRole } = render(
      <TagLinks {...props} availableTags={singleTag} />
    );

    const buttons = getAllByRole("button");
    expect(buttons).toHaveLength(1);
  });

  it("does not call onMuscleLinkClick when component initially renders", () => {
    const mockClick = jest.fn();
    render(<TagLinks {...props} onMuscleLinkClick={mockClick} />);

    expect(mockClick).not.toHaveBeenCalled();
  });

  it("allows multiple presses on the same link", () => {
    const mockClick = jest.fn();
    const { getByLabelText } = render(
      <TagLinks {...props} onMuscleLinkClick={mockClick} />
    );

    const rightCalfLink = getByLabelText("Select WADE_RECHTS muscle");

    fireEvent.press(rightCalfLink);
    fireEvent.press(rightCalfLink);
    fireEvent.press(rightCalfLink);

    expect(mockClick).toHaveBeenCalledTimes(3);
    expect(mockClick).toHaveBeenCalledWith("WADE_RECHTS");
  });
});
