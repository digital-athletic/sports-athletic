#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateNotice, generateNoticeData } from "../../scripts/notice.mjs";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

generateNotice({
  projectRoot,
  output: join(projectRoot, "THIRD-PARTY-NOTICES.txt"),
});

generateNoticeData({
  projectRoot,
  output: join(projectRoot, "src/thirdPartyNotices.json"),
});
