import { readFile, writeFile } from "fs/promises";
import path from "path";

const incrementPersistVersion = async () => {
  console.log("🤖 | Incrementing PERSIST_VERSION. Reading sharedConstants...");

  const sharedConstants = path.join(
    __dirname,
    "../src/constants/sharedConstants.ts",
  );
  const contents = await readFile(sharedConstants, "utf-8");
  // Extract number
  const exp = new RegExp(/const\s+PERSIST_VERSION\s*=\s*(\d+);/);
  const match = contents.match(exp);

  if (!match || match.length < 2) {
    throw new Error("PERSIST_VERSION not found");
  }

  const currentVersion = Number(match[1]);
  console.log(`   | Current PERSIST_VERSION: ${currentVersion}`);
  const nextVersion = currentVersion + 1;
  console.log(`   | Next PERSIST_VERSION: ${nextVersion}`);
  const updatedContents = contents.replace(
    exp,
    `const PERSIST_VERSION = ${nextVersion};`,
  );

  writeFile(sharedConstants, updatedContents, "utf8");
  console.log("✅ | Successfully incremented PERSIST_VERSION");
};

incrementPersistVersion();
