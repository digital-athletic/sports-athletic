/**
 * Curated license notices for the icon fonts that `@expo/vector-icons` bundles into
 * the app binary. These fonts are vendored inside the package under licenses that
 * differ from the wrapper's MIT code, and they ship no per-font license file (only a
 * .ttf binary), so the node_modules scan in `notice.mjs` cannot discover them. The
 * license texts live as plain files in `./licenses`; this module only maps each
 * bundled font to its file. Only the fonts this app actually imports are listed.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LICENSE_DIR = join(HERE, "licenses");

// Location of the vendored .ttf files inside the installed @expo/vector-icons package.
const FONT_DIR = join("build", "vendor", "react-native-vector-icons", "Fonts");

/** Installed @expo/vector-icons dir, via node_modules or the pnpm store. */
function vectorIconsDir(projectRoot) {
  const local = join(projectRoot, "node_modules", "@expo", "vector-icons");
  if (existsSync(local)) return local;
  const store = join(projectRoot, "..", "node_modules", ".pnpm");
  const entry = existsSync(store)
    ? readdirSync(store).find((e) => e.startsWith("@expo+vector-icons@"))
    : undefined;
  return entry
    ? join(store, entry, "node_modules", "@expo", "vector-icons")
    : local;
}

const FONTS = [
  {
    file: "FontAwesome.ttf",
    name: "FontAwesome (icon font, vendored by @expo/vector-icons)",
    version: "4.7.0",
    license: "OFL-1.1 AND MIT",
    licenseFile: "fontawesome-4.7.0.txt",
  },
  {
    file: "Ionicons.ttf",
    name: "Ionicons (icon font, vendored by @expo/vector-icons)",
    version: "bundled by @expo/vector-icons",
    license: "MIT",
    licenseFile: "ionicons.txt",
  },
];

/** Notice entries for bundled icon fonts that are actually present on disk. */
export function bundledFontNotices(projectRoot) {
  const fontDir = join(vectorIconsDir(projectRoot), FONT_DIR);
  return FONTS.filter((f) => existsSync(join(fontDir, f.file))).map(
    ({ file: _file, licenseFile, ...entry }) => ({
      ...entry,
      text: readFileSync(join(LICENSE_DIR, licenseFile), "utf8").trim(),
    }),
  );
}
