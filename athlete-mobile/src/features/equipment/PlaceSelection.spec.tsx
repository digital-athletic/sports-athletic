import { WorkoutConstants } from "@/constants/workoutConstants";
import i18n from "@/i18n";
import { fireEvent, render } from "../../utils/testUtils";
import { PlaceSelection } from "./PlaceSelection";

const [deactivated] = WorkoutConstants.DEACTIVATED_EQUIPMENT;

const places = {
  HOME: { equipment: ["DUMBBELL", deactivated] },
  STUDIO: { equipment: [] },
  HALL: { equipment: [] },
  OUTSIDE: { equipment: [] },
};

const noDays = { HOME: [], STUDIO: [], HALL: [], OUTSIDE: [] };

describe("PlaceSelection: place rows", () => {
  it("renders one button per place", async () => {
    const { getAllByRole } = await render(
      <PlaceSelection selectPlace={jest.fn()} places={places} />,
    );
    expect(getAllByRole("button")).toHaveLength(4);
  });

  it("counts only active equipment in the row label", async () => {
    const { getByLabelText } = await render(
      <PlaceSelection selectPlace={jest.fn()} places={places} />,
    );
    const label = `${i18n.t("training.place.HOME")}, ${i18n.t("equipment.xPieces", { count: 1 })}`;
    expect(getByLabelText(label)).toBeTruthy();
  });

  it("selects the pressed place", async () => {
    const selectPlace = jest.fn();
    const { getByLabelText } = await render(
      <PlaceSelection selectPlace={selectPlace} places={places} />,
    );
    const label = `${i18n.t("training.place.HALL")}, ${i18n.t("equipment.xPieces", { count: 0 })}`;
    fireEvent.press(getByLabelText(label));
    expect(selectPlace).toHaveBeenCalledWith("HALL");
  });

  it("shows and announces the training days scheduled at a place", async () => {
    const { getByText, getByLabelText } = await render(
      <PlaceSelection
        selectPlace={jest.fn()}
        places={places}
        trainingDaysAtPlaces={{
          ...noDays,
          HOME: [
            "screens.trainingDays.mondayTraining",
            "screens.trainingDays.fridayTraining",
          ],
        }}
      />,
    );
    const days = `${i18n.t("screens.trainingDays.mondayTraining")}, ${i18n.t("screens.trainingDays.fridayTraining")}`;
    expect(getByText(days)).toBeTruthy();
    const label = `${i18n.t("training.place.HOME")}, ${i18n.t("equipment.xPieces", { count: 1 })}, ${days}`;
    expect(getByLabelText(label)).toBeTruthy();
  });
});
