import {
  parseViewBox,
  SILHOUETTES,
} from "@/bodyParts/silhouette/silhouetteData";
import { PREVENTION_TILES, type TileData } from "@/constants/workoutConstants";
import { useUserProfileStore } from "@/store/userProfileStore";
import { fireEvent, render, screen } from "@/utils/testUtils";
import { ColumnList } from "./ColumnList";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));

function setGender(gender: "MALE" | "FEMALE") {
  useUserProfileStore.setState({
    personalData: {
      ...useUserProfileStore.getState().personalData,
      gender,
    },
  });
}

function queryThumbnails() {
  return screen.queryAllByTestId("silhouette-thumbnail", {
    includeHiddenElements: true,
  });
}

beforeEach(() => {
  mockNavigate.mockClear();
  setGender("MALE");
});

describe("ColumnList: prevention list rendering", () => {
  it("renders a silhouette thumbnail for every row and no other artwork", () => {
    render(<ColumnList listItems={PREVENTION_TILES} />);

    expect(queryThumbnails()).toHaveLength(5);
    expect(screen.queryAllByTestId("tile-thumbnail-image")).toHaveLength(0);
    expect(screen.queryAllByTestId("tile-thumbnail-placeholder")).toHaveLength(
      0,
    );
  });
});

describe("ColumnList: thumbnail branch precedence", () => {
  const silhouetteTile: TileData = {
    silhouette: { side: "FRONT", regions: ["CHEST"], centerY: 0.5 },
    picture: { uri: "should-not-render.png" },
    title: "training.prevention.PREVENTION_TILE_KNEE",
    navigate: { key: "/training/muscle-soreness", params: { type: "MOB" } },
  };
  const pictureTile: TileData = {
    picture: { uri: "picture.png" },
    title: "training.prevention.PREVENTION_TILE_KNEE",
    navigate: { key: "/training/muscle-soreness", params: { type: "MOB" } },
  };
  const emptyTile: TileData = {
    title: "training.prevention.PREVENTION_TILE_KNEE",
    navigate: { key: "/training/muscle-soreness", params: { type: "MOB" } },
  };

  it("renders the silhouette thumbnail when both silhouette and picture are set", () => {
    render(<ColumnList listItems={[silhouetteTile]} />);

    expect(queryThumbnails()).toHaveLength(1);
    expect(screen.queryAllByTestId("tile-thumbnail-image")).toHaveLength(0);
    expect(screen.queryAllByTestId("tile-thumbnail-placeholder")).toHaveLength(
      0,
    );
  });

  it("renders a sized image when only a picture is set", () => {
    render(<ColumnList listItems={[pictureTile]} />);

    const image = screen.getByTestId("tile-thumbnail-image");
    expect(image.props.style).toEqual(
      expect.objectContaining({ width: 96, height: 96 }),
    );
    expect(queryThumbnails()).toHaveLength(0);
    expect(screen.queryAllByTestId("tile-thumbnail-placeholder")).toHaveLength(
      0,
    );
  });

  it("renders the placeholder when the tile has no artwork", () => {
    render(<ColumnList listItems={[emptyTile]} />);

    expect(screen.getAllByTestId("tile-thumbnail-placeholder")).toHaveLength(1);
    expect(queryThumbnails()).toHaveLength(0);
    expect(screen.queryAllByTestId("tile-thumbnail-image")).toHaveLength(0);
  });
});

describe("ColumnList: row accessibility", () => {
  it("exposes exactly one button role per prevention row and no checkboxes", () => {
    render(<ColumnList listItems={PREVENTION_TILES} />);

    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});

describe("ColumnList: navigation", () => {
  it("navigates once with the pressed row's own type", () => {
    render(<ColumnList listItems={PREVENTION_TILES} />);

    fireEvent.press(screen.getAllByRole("button")[0]);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type: "PREVANKLE" },
    });
  });
});

describe("ColumnList: gender switch", () => {
  it("passes the profile gender through to every thumbnail", () => {
    setGender("FEMALE");
    render(<ColumnList listItems={PREVENTION_TILES} />);

    const expectedWidths = PREVENTION_TILES.map((tile) => {
      if (!tile.silhouette) {
        throw new Error(`Expected a silhouette payload for ${tile.title}`);
      }
      return parseViewBox(SILHOUETTES.FEMALE[tile.silhouette.side].viewBox)
        .width;
    });

    const renderedWidths = queryThumbnails().map(
      (node) => node.props.vbWidth as number,
    );
    expect(renderedWidths).toHaveLength(expectedWidths.length);
    renderedWidths.forEach((width, index) => {
      expect(width).toBeCloseTo(expectedWidths[index]);
    });
  });
});
