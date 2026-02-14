import { readFile } from "fs/promises";
import path from "path";

const auditStoreVersions = async () => {
  const versionsFile = path.join(__dirname, "../src/store/storeVersions.ts");
  const contents = await readFile(versionsFile, "utf-8");
  const versionRegex = /(\w+):\s*(\d+)/g;
  let match;

  console.log("Store Versions:");
  console.log("---------------");
  while ((match = versionRegex.exec(contents)) !== null) {
    console.log(`  ${match[1]}: ${match[2]}`);
  }
  console.log("");
  console.log("To bump a store version, edit src/store/storeVersions.ts");
  console.log(
    "and add a migration in src/store/migrations/<storeName>Migrations.ts",
  );
};

auditStoreVersions();
