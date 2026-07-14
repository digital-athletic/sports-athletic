#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateNotice } from "../../scripts/notice.mjs";
import { bundledFontNotices } from "./bundled-fonts.mjs";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
generateNotice({
  projectRoot,
  output: join(projectRoot, "THIRD-PARTY-NOTICES.txt"),
  supplements: bundledFontNotices(projectRoot),
});
