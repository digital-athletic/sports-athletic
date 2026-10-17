import de from "./locales/de.json";
import en from "./locales/en.json";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      leafPaths(child, prefix === "" ? key : `${prefix}.${key}`),
    );
  }
  return [prefix];
}

describe("locale parity: de and en", () => {
  const dePaths = leafPaths(de).sort();
  const enPaths = leafPaths(en).sort();

  it("has no key in de that is missing in en", () => {
    expect(dePaths.filter((path) => !enPaths.includes(path))).toEqual([]);
  });

  it("has no key in en that is missing in de", () => {
    expect(enPaths.filter((path) => !dePaths.includes(path))).toEqual([]);
  });
});
