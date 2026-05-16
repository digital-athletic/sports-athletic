export const ErrorCodes = {
  // Auth errors
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID: "AUTH_INVALID",

  // Team errors
  TEAM_NAME_REQUIRED: "TEAM_NAME_REQUIRED",
  TEAM_ID_REQUIRED: "TEAM_ID_REQUIRED",
  TEAM_NOT_FOUND: "TEAM_NOT_FOUND",
  ALREADY_TEAM_MEMBER: "ALREADY_TEAM_MEMBER",
  NOT_TEAM_MEMBER: "NOT_TEAM_MEMBER",
  NOT_TEAM_OWNER: "NOT_TEAM_OWNER",

  // Member errors
  OWNER_CANNOT_LEAVE: "OWNER_CANNOT_LEAVE",
  CANNOT_REMOVE_SELF: "CANNOT_REMOVE_SELF",
  MEMBER_NOT_FOUND: "MEMBER_NOT_FOUND",
  MEMBER_USER_ID_REQUIRED: "MEMBER_USER_ID_REQUIRED",

  // Invite code errors
  INVITE_CODE_REQUIRED: "INVITE_CODE_REQUIRED",
  INVITE_CODE_INVALID: "INVITE_CODE_INVALID",
  INVITE_CODE_INACTIVE: "INVITE_CODE_INACTIVE",
  INVITE_CODE_EXPIRED: "INVITE_CODE_EXPIRED",
  INVITE_CODE_MAX_USES: "INVITE_CODE_MAX_USES",

  // Request errors
  INVALID_REQUEST_BODY: "INVALID_REQUEST_BODY",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",

  // Trainer whitelist errors
  NOT_A_TRAINER: "NOT_A_TRAINER",

  // Admin errors
  NOT_AN_ADMIN: "NOT_AN_ADMIN",
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // Generic errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const Roles = {
  OWNER: "owner",
  MEMBER: "member",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];

export const Tables = {
  TEAMS: "teams",
  TEAM_MEMBERS: "team_members",
  TEAM_INVITATIONS: "team_invitations",
} as const;

export type Table = (typeof Tables)[keyof typeof Tables];

export const HttpMethods = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
} as const;

export type HttpMethod = (typeof HttpMethods)[keyof typeof HttpMethods];
