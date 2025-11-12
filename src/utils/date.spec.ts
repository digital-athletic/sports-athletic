import { dateToDDMMYYYY } from "./date";

describe("date utils", () => {
  it("formats date correctly", () => {
    const date = new Date(2024, 0, 5); // January 5, 2024
    const formattedDate = dateToDDMMYYYY(date);
    expect(formattedDate).toBe("05-01-2024");
  });
});
