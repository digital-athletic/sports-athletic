#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateNotice } from "../../scripts/notice.mjs";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
// Emit into public/ so `vite build` copies it into dist/ (the served artifact).
generateNotice({
  projectRoot,
  output: join(projectRoot, "public", "NOTICE.md"),
});
