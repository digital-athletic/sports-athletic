/**
 * Minimal client for the Zenodo API.
 *
 * A Zenodo draft record is created with the legacy deposit API, and the
 * files are uploaded into its bucket. Without a Zenodo community, the
 * deposit API publishes it. With a Zenodo community, publishing goes
 * through the newer records API: the Zenodo draft record gets a Zenodo
 * community submission request, and accepting that request publishes the
 * Zenodo record into the Zenodo community. (The legacy `communities`
 * metadata field would only open the request after publishing.)
 * API docs: https://developers.zenodo.org/ and
 * https://inveniordm.docs.cern.ch/reference/rest_api_drafts_records/
 */
import { openAsBlob } from "node:fs";
import { HttpError, type HttpClient } from "./http.ts";

/** A Zenodo instance, e.g. https://sandbox.zenodo.org or https://zenodo.org. */
export type ZenodoInstance = { url: string; apiUrl: string; host: string };

export function parseZenodoUrl(value: string): ZenodoInstance {
  const url = new URL(value);
  if (url.protocol !== "https:")
    throw new Error(`ZENODO_URL must use https: ${value}`);
  return { url: url.origin, apiUrl: `${url.origin}/api`, host: url.host };
}

/** True for sandbox.zenodo.org, where Zenodo records are test data. */
export const isSandbox = (instance: ZenodoInstance): boolean =>
  instance.host.startsWith("sandbox.");

/** A Zenodo draft record or a published Zenodo record. */
export type Deposition = {
  id: number;
  conceptrecid?: string;
  doi?: string;
  conceptdoi?: string;
  submitted: boolean;
  links: { bucket?: string; html?: string; record_html?: string };
  files?: { filename: string; checksum: string }[];
};

export type DepositionMetadata = {
  upload_type: "video";
  title: string;
  description: string;
  creators: { name: string; affiliation?: string; orcid?: string }[];
  access_right: "open";
  license: string;
  language: string;
  keywords: string[];
};

/** A Zenodo community submission request. */
type CommunityRequest = { id: string; status: string; type?: string };

export type ZenodoClient = ReturnType<typeof createZenodoClient>;

/** Zenodo reports checksums either as `md5:<hex>` or as plain hex. */
export const normalizeChecksum = (checksum: string): string =>
  checksum.replace(/^md5:/, "");

export function createZenodoClient(http: HttpClient, apiUrl: string) {
  const depositions = `${apiUrl}/deposit/depositions`;
  const records = `${apiUrl}/records`;

  const send = <T>(method: string, url: string, body?: unknown) =>
    http.json<T>(url, {
      method,
      ...(body !== undefined && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    });
  const message = (content: string) => ({
    payload: { content, format: "html" },
  });

  const get = (id: number) => http.json<Deposition>(`${depositions}/${id}`);

  /**
   * The Zenodo draft record's open Zenodo community request, if any.
   * Zenodo answers `GET .../draft/review` with 500 once a request exists,
   * so on a server error the request is looked up in the request search.
   */
  async function findCommunityRequest(
    id: number,
  ): Promise<CommunityRequest | undefined> {
    try {
      return await http.json<CommunityRequest>(`${records}/${id}/draft/review`);
    } catch (error: unknown) {
      if (!(error instanceof HttpError)) throw error;
      if (error.status === 404) return undefined;
      if (error.status < 500) throw error;
    }
    const result = await http.json<{ hits: { hits: CommunityRequest[] } }>(
      `${apiUrl}/requests?q=${encodeURIComponent(`topic.record:${id}`)}`,
    );
    return result.hits.hits.find(
      (request) =>
        request.type === "community-submission" &&
        !["declined", "cancelled", "expired"].includes(request.status),
    );
  }

  return {
    get,

    create: (metadata: DepositionMetadata) =>
      send<Deposition>("POST", depositions, { metadata }),

    /** Uploads a file into the Zenodo draft record, replacing one of the same name. */
    async uploadFile(
      bucketUrl: string,
      filename: string,
      path: string,
    ): Promise<{ checksum: string }> {
      return http.json(`${bucketUrl}/${encodeURIComponent(filename)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: await openAsBlob(path),
      });
    },

    /** UUID of the Zenodo community with a slug such as `sports-athletic`. */
    communityId: async (slug: string) =>
      (await http.json<{ id: string }>(`${apiUrl}/communities/${slug}`)).id,

    /**
     * Publishes the Zenodo draft record, into the Zenodo community if one is
     * given. That needs a Zenodo token of a Zenodo community owner or
     * curator, because the script accepts its own request.
     */
    async publish(id: number, communityId?: string): Promise<Deposition> {
      if (!communityId) {
        await send("POST", `${depositions}/${id}/actions/publish`);
        return get(id);
      }
      let request =
        (await findCommunityRequest(id)) ??
        (await send<CommunityRequest>("PUT", `${records}/${id}/draft/review`, {
          receiver: { community: communityId },
          type: "community-submission",
        }));
      if (request.status === "created") {
        request = await send<CommunityRequest>(
          "POST",
          `${records}/${id}/draft/actions/submit-review`,
          message("Submitted by the Sports Athletic asset mirror."),
        );
      }
      if (request.status === "submitted") {
        request = await send<CommunityRequest>(
          "POST",
          `${apiUrl}/requests/${request.id}/actions/accept`,
          message("Accepted by the Sports Athletic asset mirror."),
        );
      }
      if (request.status !== "accepted") {
        throw new Error(
          `Zenodo community request ${request.id} is ${request.status}`,
        );
      }
      return get(id);
    },
  };
}
