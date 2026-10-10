// Serves the `expo export --platform web` output for e2e runs. Unknown paths
// fall back to index.html so expo-router can resolve deep links client side.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(process.argv[2] ?? "dist");
const port = Number(process.env.PORT ?? 8081);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
};

const indexFile = join(root, "index.html");

async function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return indexFile;
  }
  const candidate = join(root, normalize(decoded));
  if (!candidate.startsWith(root + sep)) return indexFile;
  const info = await stat(candidate).catch(() => null);
  if (info?.isFile()) return candidate;
  // A missing asset must fail loudly instead of returning the app shell.
  return extname(candidate) ? null : indexFile;
}

createServer(async (req, res) => {
  const file = await resolveFile(
    new URL(req.url ?? "/", "http://e2e").pathname,
  );
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file)
    .on("error", () => res.destroy())
    .pipe(res);
}).listen(port, () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
});
