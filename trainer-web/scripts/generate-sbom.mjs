#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSbom } from "../../scripts/sbom.mjs";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
generateSbom({ projectRoot, output: join(projectRoot, "sbom.json") });
