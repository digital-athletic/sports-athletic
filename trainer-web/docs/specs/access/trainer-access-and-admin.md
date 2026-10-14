# Trainer Access and Admin

## Why & What

Only vetted trainers may create teams and read athlete training data. An **admin** grants and revokes **trainer access** per account on the admin page. This spec defines both flags, the admin page, and what revoking trainer access changes.

## Problem

Any athlete account can sign in to the dashboard. Without a grant, every account could create teams and collect other athletes' training data. The athlete app reads neither flag, so the dashboard and the database enforce the rules alone.

## Solution

Two timestamps on the account profile hold the flags: set means granted, empty means not granted. Accounts cannot write either flag themselves. Admins grant trainer access through the admin page; admin status itself has no UI and comes from a direct database write.

If the dashboard fails to read the profile, it treats the user as neither trainer nor admin.

## Out of Scope

- Sign-in: [Sign-In](./sign-in.md)
- What team owners do with trainer access: [Team Lifecycle](../teams/team-lifecycle.md)
- How trainer access gates athlete data: [Athlete Evaluations](../evaluations/athlete-evaluations.md)

## Rules

### Admin page

1. Team selection shows an "Admin" button to admins only.
2. The admin searches by email. The dashboard trims the input; the backend rejects malformed addresses and matches the address character for character, including letter case.
3. The result card shows the email and either "Trainer since <date>" or "Not a trainer".
4. One button toggles the grant: granting stores the current time, revoking clears it. No confirmation step. Admins may change their own trainer access.

### Errors

| Code | Shown text |
|---|---|
| AUTH_REQUIRED | generic error |
| NOT_AN_ADMIN | You do not have admin access |
| INVALID_REQUEST_BODY | generic error |
| USER_NOT_FOUND | No user found with that email address |

### Effects of revoking trainer access

| Area | After revoke |
|---|---|
| Create team | blocked |
| Teams the account owns | stay owned; owner actions keep working |
| Athlete data in those teams | hidden from owner and co-owners |

Accounts without trainer access see "Trainer access required" in place of the create button, with a hint to contact the Sports Athletic team.

## Structure

The flags live on the account profile, which the athlete app also writes during consent. Only privileged database functions write the trainer flag; the admin flag has no write path besides direct database access.

## Open Questions

- Should email lookup ignore letter case? Options: keep exact match, or compare lowercased. Leaning: lowercase, since admins type addresses by hand.
- Should admins get a UI to grant admin status? Leaning: no while there are few admins.
