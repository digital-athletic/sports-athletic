/**
 * Shared CycloneDX SBOM generator for workspace packages, using `npm sbom`.
 * pnpm's shared workspace lockfile cannot be scoped to a single member, so the
 * prod manifest is installed into a throwaway directory and the SBOM is produced
 * there. The isolated npm resolution is a faithful superset of the shipped tree.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function generateSbom({ projectRoot, output }) {
  const pkg = JSON.parse(
    readFileSync(join(projectRoot, "package.json"), "utf8"),
  );

  // Pin each direct dependency to the version installed in node_modules. Re-resolving
  // the `^` ranges in isolation can drift (e.g. a newer react-dom whose peer range no
  // longer matches the pinned react), which npm sbom rejects.
  const dependencies = {};
  for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
    try {
      const dep = JSON.parse(
        readFileSync(
          join(projectRoot, "node_modules", name, "package.json"),
          "utf8",
        ),
      );
      dependencies[name] = dep.version;
    } catch {
      dependencies[name] = range;
    }
  }
  const manifest = {
    name: pkg.name,
    version: pkg.version ?? "0.0.0",
    dependencies,
  };

  const work = mkdtempSync(join(tmpdir(), "sbom-"));
  try {
    writeFileSync(
      join(work, "package.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    // --legacy-peer-deps: RN/Expo peer ranges are stricter than npm's resolver
    // accepts; pnpm tolerates them, so this keeps the isolated install faithful.
    execFileSync(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--legacy-peer-deps",
      ],
      { cwd: work, stdio: "inherit" },
    );
    const sbom = execFileSync("npm", ["sbom", "--sbom-format", "cyclonedx"], {
      cwd: work,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    writeFileSync(output, sbom);
    const count = JSON.parse(sbom).components?.length ?? "?";
    process.stdout.write(`Wrote SBOM (${count} components) to ${output}\n`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
