# Invite Codes and Joining

## Why & What

Athletes join a team with an **invite code** the owner shares. The athlete app and the dashboard call the same join rule. This spec defines the code format, regeneration, and the checks a join runs.

## Problem

A code must be short enough to type on a phone, unique across all teams, and revocable once it leaks. The owner needs a way to cut off an old code without deleting the team.

## Solution

Codes have six characters from uppercase letters and digits. A team holds one active code in practice: creating a team issues one, and regenerating deactivates every active code before issuing a new one. Any signed-in account may join, trainer or not, and an account may belong to several teams.

## Out of Scope

- Creating the team and its first code: [Team Lifecycle](./team-lifecycle.md)
- What a member can do after joining: [Members and Roles](./members-and-roles.md)
- The join screen in the athlete app

## Rules

### Code generation

1. Draw six characters, each uniform over A to Z and 0 to 9.
2. Retry on collision with an existing code, up to 10 times, then fail.
3. Store the code active, with a use count of zero. Expiry and use limit stay empty; the backend supports both, but the dashboard never sets them.

### Owner view

1. Only the owner sees the invite code section. The backend hides codes from everyone else.
2. The section shows the newest active code with a copy button, or "No active invite codes".
3. Regenerate runs without confirmation: deactivate all active codes of the team, then generate one new code.

### Join

1. The dashboard uppercases the input and enables submit at exactly six characters.
2. The backend trims and uppercases the code and rejects anything besides letters and digits.
3. The backend locks the code's row, so concurrent joins on one code run one after another, then checks in this order:

| Order | Check | Error |
|---|---|---|
| 1 | Code exists | INVITE_CODE_INVALID |
| 2 | Code active | INVITE_CODE_INACTIVE |
| 3 | Not expired | INVITE_CODE_EXPIRED |
| 4 | Use limit not reached | INVITE_CODE_MAX_USES |
| 5 | Caller not yet in the team | ALREADY_TEAM_MEMBER |

4. On success the backend adds the caller with role member and raises the code's use count by one. The dashboard opens the team.

## Structure

A team has many invite codes over its lifetime; at most one stays active under normal use. Deleting the team deletes its codes.

## Open Questions

- The section heading and hint speak of "codes" in the plural but show one code. Should the text change to the singular? Leaning: yes.
- Should owners set an expiry or use limit? Options: expose both, or drop them from the backend. Leaning: drop until a trainer asks.
