#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSbom } from "../../scripts/notice.mjs";
import { bundledFontNotices } from "./bundled-fonts.mjs";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
generateSbom({
  projectRoot,
  output: join(projectRoot, "SPDX_athlete-mobile.spdx.json"),
  supplements: bundledFontNotices(projectRoot),
});
