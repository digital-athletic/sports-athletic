import * as v from "npm:valibot@1";
import { ErrorCodes, HttpStatus } from "./constants.ts";
import { errorResponse } from "./response.ts";

export interface ParseSuccess<T> {
  success: true;
  data: T;
}

export interface ParseFailure {
  success: false;
  error: Response;
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export async function parseRequestBody<T>(
  req: Request,
  schema: v.GenericSchema<unknown, T>,
): Promise<ParseResult<T>> {
  let json: unknown;

  try {
    json = await req.json();
  } catch {
    return {
      success: false,
      error: errorResponse(
        ErrorCodes.INVALID_REQUEST_BODY,
        HttpStatus.BAD_REQUEST,
      ),
    };
  }

  const result = v.safeParse(schema, json);

  if (!result.success) {
    return {
      success: false,
      error: errorResponse(
        ErrorCodes.INVALID_REQUEST_BODY,
        HttpStatus.BAD_REQUEST,
      ),
    };
  }

  return { success: true, data: result.output };
}

export const CreateTeamSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  description: v.optional(v.pipe(v.string(), v.trim())),
});

export type CreateTeamInput = v.InferOutput<typeof CreateTeamSchema>;

export const AcceptInvitationSchema = v.object({
  code: v.pipe(v.string(), v.trim(), v.regex(/^[A-Z0-9]+$/i)),
});

export type AcceptInvitationInput = v.InferOutput<
  typeof AcceptInvitationSchema
>;

export const LeaveTeamSchema = v.object({
  team_id: v.pipe(v.string(), v.uuid()),
});

export type LeaveTeamInput = v.InferOutput<typeof LeaveTeamSchema>;

export const DeleteTeamSchema = LeaveTeamSchema;
export type DeleteTeamInput = LeaveTeamInput;

export const RemoveMemberSchema = v.object({
  team_id: v.pipe(v.string(), v.uuid()),
  member_user_id: v.pipe(v.string(), v.uuid()),
});

export type RemoveMemberInput = v.InferOutput<typeof RemoveMemberSchema>;

export const GenerateInviteCodeSchema = v.object({
  team_id: v.pipe(v.string(), v.uuid()),
  expires_at: v.optional(v.pipe(v.string(), v.isoTimestamp())),
  max_uses: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  deactivate_existing: v.optional(v.boolean()),
});

export type GenerateInviteCodeInput = v.InferOutput<
  typeof GenerateInviteCodeSchema
>;
