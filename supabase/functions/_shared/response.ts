import { corsHeaders } from "./cors.ts";
import {
  type ErrorCode,
  ErrorCodes,
  type HttpMethod,
  HttpMethods,
  type HttpStatus,
  HttpStatus as Status,
} from "./constants.ts";

export { ErrorCodes, type ErrorCode };

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

export function jsonResponse<T>(
  data: T,
  status: HttpStatus = Status.OK,
): Response {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

export function errorResponse(error: ErrorCode, status: HttpStatus): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: jsonHeaders,
  });
}

export function corsPreflightResponse(): Response {
  return new Response("ok", { headers: corsHeaders });
}

export function internalErrorResponse(): Response {
  return errorResponse(ErrorCodes.INTERNAL_ERROR, Status.INTERNAL_SERVER_ERROR);
}

export function badRequestResponse(
  error: ErrorCode = ErrorCodes.INVALID_REQUEST_BODY,
): Response {
  return errorResponse(error, Status.BAD_REQUEST);
}

export function methodNotAllowedResponse(): Response {
  return errorResponse(
    ErrorCodes.METHOD_NOT_ALLOWED,
    Status.METHOD_NOT_ALLOWED,
  );
}

export interface MethodCheckResult {
  ok: true;
  error?: never;
}

export interface MethodCheckError {
  ok?: never;
  error: Response;
}

export type MethodCheck = MethodCheckResult | MethodCheckError;

export function requireMethod(req: Request, method: HttpMethod): MethodCheck {
  if (req.method === HttpMethods.OPTIONS) {
    return { error: corsPreflightResponse() };
  }

  if (req.method !== method) {
    return { error: methodNotAllowedResponse() };
  }

  return { ok: true };
}
