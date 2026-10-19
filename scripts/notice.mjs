/**
 * Shared license tooling for the projects (athlete-mobile, trainer-web)
 *
 * - `generateSbom` writes an SPDX 2.3 SBOM (`SPDX_<artifact>.spdx.json`) with
 *   SPDX license identifiers where available, full original license texts,
 *   copyright notices, and the project itself as the described root component.
 * - `generateNotice` writes the human-readable THIRD-PARTY-NOTICES.txt with the
 *   direct production dependencies and their license texts.
 *
 * Both read the pnpm tree that is actually installed (lockfile + virtual
 * store).
 *
 * CLI usage (from inside a project folder):
 *   node ../scripts/notice.mjs [--name <artifact>] [--output <file>]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

// --- License identifier handling ----------------------------------------------
// pnpm reports whatever package.json declares, which is not always valid SPDX.
// Unambiguous aliases are mapped; everything else that fails expression
// validation becomes a LicenseRef carrying the package's shipped license text.
const LICENSE_MAP = {
  "Apache 2.0": "Apache-2.0",
  "Apache License 2.0": "Apache-2.0",
  "MIT*": "MIT",
  "(BSD-3-Clause OR GPL-2.0)": "BSD-3-Clause OR GPL-2.0-only",
};

const normalizeLicense = (license) => {
  if (!license || /^unknown$/i.test(license)) return "NOASSERTION";
  return LICENSE_MAP[license] ?? license;
};

/** Syntactic check for SPDX license expressions (ids, AND/OR/WITH, parens, +). */
function isValidSpdxExpression(expression) {
  const tokens = expression.match(/[()]|[^\s()]+/g);
  if (!tokens) return false;
  const ID = /^[A-Za-z0-9.-]+\+?$/;
  let depth = 0;
  let expectOperand = true;
  for (const token of tokens) {
    if (token === "(") {
      if (!expectOperand) return false;
      depth++;
    } else if (token === ")") {
      if (expectOperand || depth === 0) return false;
      depth--;
    } else if (token === "AND" || token === "OR" || token === "WITH") {
      if (expectOperand) return false;
      expectOperand = true;
    } else {
      if (!expectOperand || !ID.test(token)) return false;
      expectOperand = false;
    }
  }
  return depth === 0 && !expectOperand;
}

// --- License text + copyright extraction ---------------------------------------
const LICENSE_FILE_RE = /^(LICENSE|LICENCE|COPYING|NOTICE)([-.].*)?$/i;
const COPYRIGHT_RE = /^.*copyright\s+(\(c\)|©|\d{4}).*$/gim;

function extractCopyrights(content, into) {
  for (const m of content.match(COPYRIGHT_RE) ?? []) into.add(m.trim());
}

function readLicenseArtifacts(pkgPath) {
  if (!pkgPath || !existsSync(pkgPath)) return { texts: [], copyrights: [] };
  const texts = [];
  const copyrights = new Set();

  for (const entry of readdirSync(pkgPath).sort()) {
    if (!LICENSE_FILE_RE.test(entry)) continue;
    try {
      const content = readFileSync(join(pkgPath, entry), "utf8").trim();
      if (content) texts.push(content);
      extractCopyrights(content, copyrights);
    } catch {
      // Unreadable license file; the declared identifier still documents the terms.
    }
  }

  // Fallback: some packages only carry the copyright line in their README.
  if (copyrights.size === 0) {
    const readme = join(pkgPath, "README.md");
    if (existsSync(readme)) {
      try {
        extractCopyrights(readFileSync(readme, "utf8"), copyrights);
      } catch {
        // README is only a fallback source; ignore.
      }
    }
  }

  return { texts, copyrights: [...copyrights] };
}

// --- pnpm inventory --------------------------------------------------------------
/** All production packages of the given project, one entry per version. */
function collectInventory(projectRoot) {
  const raw = execFileSync("pnpm", ["licenses", "list", "--prod", "--json"], {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });

  return Object.entries(JSON.parse(raw))
    .flatMap(([groupLicense, pkgs]) =>
      pkgs.flatMap((pkg) =>
        (pkg.versions ?? []).map((version, i) => ({
          name: pkg.name,
          version,
          path: pkg.paths?.[i],
          license: pkg.license ?? groupLicense,
          homepage: pkg.homepage,
          description: pkg.description,
        })),
      ),
    )
    .sort((a, b) =>
      `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`),
    );
}

// --- SPDX SBOM -------------------------------------------------------------------
/**
 * Writes `SPDX_<artifact>.spdx.json` for a project. `supplements`
 * lists bundled components pnpm cannot see (e.g. vendored icon fonts) as
 * `{ name, version, license, text }`.
 */
export function generateSbom({ projectRoot, name, output, supplements = [] }) {
  const manifest = JSON.parse(
    readFileSync(join(projectRoot, "package.json"), "utf8"),
  );
  const artifactName = name ?? manifest.name ?? "artifact";
  const outputPath =
    output ?? join(projectRoot, `SPDX_${artifactName}.spdx.json`);

  const ROOT_ID = "SPDXRef-Package-root";
  const spdxPackages = [];
  const relationships = [];
  const extractedLicensingInfos = [];
  const seenExtractedRefs = new Set();
  const seenSpdxIds = new Set([ROOT_ID]);
  const nonSpdxDeclarations = new Set();

  let withText = 0;
  let withCopyright = 0;

  const toIdString = (value) => value.replace(/[^A-Za-z0-9.-]/g, "-");

  const licenseRefFor = (pkgName, declared, texts) => {
    const ref = `LicenseRef-${toIdString(pkgName)}`;
    if (!seenExtractedRefs.has(ref)) {
      extractedLicensingInfos.push({
        licenseId: ref,
        name: `Declared license of ${pkgName}${declared ? `: ${declared}` : ""}`,
        // Prefer the shipped license text; fall back to the raw declaration so
        // the reference is never empty.
        extractedText: texts[0] ?? declared ?? "NOASSERTION",
      });
      seenExtractedRefs.add(ref);
    }
    return ref;
  };

  const uniqueSpdxId = (pkgName, version) => {
    let spdxId = `SPDXRef-Package-${toIdString(pkgName)}-${toIdString(version)}`;
    while (seenSpdxIds.has(spdxId)) spdxId += "-dup";
    seenSpdxIds.add(spdxId);
    return spdxId;
  };

  const addComponent = ({
    pkgName,
    version,
    declaredLicense,
    texts,
    copyrights,
    homepage,
    description,
    fromRegistry,
  }) => {
    if (texts.length) withText++;
    if (copyrights.length) withCopyright++;

    let licenseDeclared = normalizeLicense(declaredLicense);
    if (licenseDeclared === "NOASSERTION") {
      if (texts.length) licenseDeclared = licenseRefFor(pkgName, null, texts);
    } else if (!isValidSpdxExpression(licenseDeclared)) {
      nonSpdxDeclarations.add(declaredLicense);
      licenseDeclared = licenseRefFor(pkgName, declaredLicense, texts);
    }

    const spdxId = uniqueSpdxId(pkgName, version);
    const purlName = pkgName.startsWith("@")
      ? `%40${pkgName.slice(1)}`
      : pkgName;
    const tarball = `https://registry.npmjs.org/${pkgName}/-/${pkgName.split("/").pop()}-${version}.tgz`;

    spdxPackages.push({
      SPDXID: spdxId,
      name: pkgName,
      versionInfo: version,
      downloadLocation: fromRegistry ? tarball : "NOASSERTION",
      homepage: homepage ?? "NOASSERTION",
      filesAnalyzed: false,
      licenseConcluded: "NOASSERTION",
      licenseDeclared,
      copyrightText: copyrights.length ? copyrights.join("\n") : "NOASSERTION",
      description: description ?? undefined,
      externalRefs: fromRegistry
        ? [
            {
              referenceCategory: "PACKAGE-MANAGER",
              referenceType: "purl",
              referenceLocator: `pkg:npm/${purlName}@${version}`,
            },
          ]
        : undefined,
      // openCode requires the full original license texts inside the SBOM.
      attributionTexts: texts.length ? texts : undefined,
    });

    relationships.push({
      spdxElementId: ROOT_ID,
      relatedSpdxElement: spdxId,
      relationshipType: "DEPENDS_ON",
    });
  };

  for (const pkg of collectInventory(projectRoot)) {
    const { texts, copyrights } = readLicenseArtifacts(pkg.path);
    addComponent({
      pkgName: pkg.name,
      version: pkg.version,
      declaredLicense: pkg.license,
      texts,
      copyrights,
      homepage: pkg.homepage,
      description: pkg.description,
      fromRegistry: /^\d/.test(pkg.version),
    });
  }

  for (const extra of supplements) {
    const copyrights = new Set();
    if (extra.text) extractCopyrights(extra.text, copyrights);
    addComponent({
      pkgName: extra.name,
      version: extra.version ?? "unknown",
      declaredLicense: extra.license,
      texts: extra.text ? [extra.text] : [],
      copyrights: [...copyrights],
      fromRegistry: false,
    });
  }

  // The project itself must appear as the described root component.
  // Projects sit one level below the repository root, which holds the NOTICE.
  const rootNotice = join(projectRoot, "..", "NOTICE");
  const rootCopyrights = new Set();
  if (existsSync(rootNotice)) {
    extractCopyrights(readFileSync(rootNotice, "utf8"), rootCopyrights);
  }
  const rootLicense = normalizeLicense(manifest.license);
  spdxPackages.unshift({
    SPDXID: ROOT_ID,
    name: artifactName,
    versionInfo: manifest.version ?? "0.0.0",
    downloadLocation: "NOASSERTION",
    filesAnalyzed: false,
    licenseConcluded: "NOASSERTION",
    licenseDeclared: isValidSpdxExpression(rootLicense)
      ? rootLicense
      : "NOASSERTION",
    copyrightText: rootCopyrights.size
      ? [...rootCopyrights].join("\n")
      : "NOASSERTION",
    primaryPackagePurpose: "APPLICATION",
  });

  const doc = {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: artifactName,
    documentNamespace: `https://spdx.org/spdxdocs/${toIdString(artifactName)}-${randomUUID()}`,
    creationInfo: {
      created: new Date().toISOString().replace(/\.\d{3}/, ""),
      creators: ["Tool: notice.mjs (pnpm SPDX SBOM generator)"],
    },
    documentDescribes: [ROOT_ID],
    packages: spdxPackages,
    relationships: [
      {
        spdxElementId: "SPDXRef-DOCUMENT",
        relatedSpdxElement: ROOT_ID,
        relationshipType: "DESCRIBES",
      },
      ...relationships,
    ],
    hasExtractedLicensingInfos: extractedLicensingInfos.length
      ? extractedLicensingInfos
      : undefined,
  };

  writeFileSync(outputPath, `${JSON.stringify(doc, null, 2)}\n`);

  console.log(`SBOM written: ${outputPath}`);
  console.log(`  components:         ${spdxPackages.length - 1}`);
  console.log(`  with license text:  ${withText}`);
  console.log(`  with copyright:     ${withCopyright}`);
  console.log(`  LicenseRef entries: ${extractedLicensingInfos.length}`);
  if (nonSpdxDeclarations.size) {
    console.log(
      `  non-SPDX declarations kept as LicenseRef: ${[...nonSpdxDeclarations].join(", ")}`,
    );
  }
}

// --- THIRD-PARTY-NOTICES ----------------------------------------------------------
/** Describe a direct dependency from node_modules, or the store as fallback. */
function describeDirect(projectRoot, depName, inventoryByName) {
  const localDir = join(projectRoot, "node_modules", depName);
  if (existsSync(join(localDir, "package.json"))) {
    const manifest = JSON.parse(
      readFileSync(join(localDir, "package.json"), "utf8"),
    );
    const license =
      typeof manifest.license === "string"
        ? manifest.license
        : manifest.license?.type;
    return {
      name: depName,
      version: manifest.version ?? "unknown",
      license: license ?? "unknown",
      text: readLicenseArtifacts(localDir).texts[0] ?? null,
    };
  }
  const entries = inventoryByName.get(depName);
  if (!entries?.length) {
    return {
      name: depName,
      version: "unknown",
      license: "unknown",
      text: null,
    };
  }
  const entry = entries[entries.length - 1];
  return {
    name: depName,
    version: entry.version,
    license: entry.license ?? "unknown",
    text: readLicenseArtifacts(entry.path).texts[0] ?? null,
  };
}

/**
 * Direct production dependencies of a project, with license text where available.
 * `supplements` adds bundled components as `{ name, version, license, text }`.
 */
export function collectDirectDependencies({ projectRoot, supplements = [] }) {
  const manifest = JSON.parse(
    readFileSync(join(projectRoot, "package.json"), "utf8"),
  );
  const inventoryByName = new Map();
  for (const entry of collectInventory(projectRoot)) {
    const list = inventoryByName.get(entry.name) ?? [];
    list.push(entry);
    inventoryByName.set(entry.name, list);
  }

  return [
    ...Object.keys(manifest.dependencies ?? {}).map((depName) =>
      describeDirect(projectRoot, depName, inventoryByName),
    ),
    ...supplements,
  ].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Writes the human-readable notice file for the direct production dependencies.
 * `supplements` adds bundled components as `{ name, version, license, text }`.
 */
export function generateNotice({ projectRoot, output, supplements = [] }) {
  const deps = collectDirectDependencies({ projectRoot, supplements });

  const lines = [
    "# Notice",
    "",
    "This application includes the following direct open source dependencies.",
    "It is generated by `scripts/generate-notice.mjs`; do not edit it by hand.",
    "",
    "| Package | Version | License |",
    "| --- | --- | --- |",
    ...deps.map((d) => `| ${d.name} | ${d.version} | ${d.license} |`),
    "",
    "## License Texts",
    "",
  ];
  for (const d of deps) {
    lines.push(`### ${d.name}@${d.version}`, "");
    lines.push(`- License: ${d.license}`);
    lines.push("");
    if (d.text) lines.push("```", d.text, "```", "");
  }

  writeFileSync(output, `${lines.join("\n")}\n`);
  process.stdout.write(
    `Wrote NOTICE for ${deps.length} dependencies to ${output}\n`,
  );
}

/**
 * Writes a small `{ name, version, license }[]` JSON artifact for in-app display, omitting
 * the full license texts that `generateNotice` embeds. `supplements` as in `generateNotice`.
 */
export function generateNoticeData({ projectRoot, output, supplements = [] }) {
  const deps = collectDirectDependencies({ projectRoot, supplements }).map(
    ({ name, version, license }) => ({ name, version, license }),
  );

  writeFileSync(output, `${JSON.stringify(deps, null, 2)}\n`);
  process.stdout.write(
    `Wrote notice data for ${deps.length} dependencies to ${output}\n`,
  );
}

// --- CLI ---------------------------------------------------------------------------
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, cur, i, arr) => {
      if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
      return acc;
    }, []),
  );
  generateSbom({
    projectRoot: process.cwd(),
    name: args.name,
    output: args.output,
  });
}
