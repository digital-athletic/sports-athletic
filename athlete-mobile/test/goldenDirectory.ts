/**
 * Golden fixture I/O: honours `UPDATE_GOLDEN` outside CI and asserts byte
 * equality, so a golden-backed test only has to produce its string. Bind one
 * instance next to the fixtures it owns; callers never resolve paths.
 */
import fs from "node:fs";
import path from "node:path";

export class GoldenDirectory {
  constructor(private readonly directory: string) {}

  assertMatches(fileName: string, actual: string): void {
    const filePath = path.join(this.directory, fileName);
    if (process.env.UPDATE_GOLDEN) {
      if (process.env.CI) {
        throw new Error("UPDATE_GOLDEN must not be set in CI");
      }
      fs.writeFileSync(filePath, actual);
      return;
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Missing golden ${fileName}; regenerate with UPDATE_GOLDEN=1 (see ${path.join(this.directory, "README.md")})`,
      );
    }
    expect(actual).toBe(fs.readFileSync(filePath, "utf8"));
  }
}
