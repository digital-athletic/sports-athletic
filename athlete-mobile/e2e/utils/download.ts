import { type Download } from "@playwright/test";

/**
 * Reads a download as UTF-8 text, keeping the byte order mark.
 * Uses the stream because path() is unavailable with a remote browser.
 */
export async function readDownload(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
