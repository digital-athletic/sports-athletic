# Members and Roles

## Why & What

Every team member holds one of three roles: **owner**, **co-owner** or **member**. The owner manages the member list; a co-owner helps the owner follow athletes. This spec defines the roles, the member list, and how members leave or get removed.

## Problem

A trainer often shares a team with an assistant coach who needs the athletes' data but should not manage the team. A two-role model forces a choice between too much and too little access.

## Solution

The owner promotes a member to co-owner and demotes back. A co-owner sees athlete training data and otherwise acts as a member in the dashboard. The owner removes members; members and co-owners leave on their own; the owner cannot leave.

## Out of Scope

- Joining: [Invite Codes and Joining](./invite-codes-and-joining.md)
- Deleting the team: [Team Lifecycle](./team-lifecycle.md)
- Which data a co-owner sees: [Athlete Evaluations](../evaluations/athlete-evaluations.md)

## Rules

### Role matrix

| Action | Owner | Co-owner | Member |
|---|---|---|---|
| See member list | yes | yes | yes |
| See invite code, regenerate | yes | no | no |
| Promote, demote | yes | no | no |
| Remove a member | yes | no | no |
| See athlete training data | yes | yes | no |
| Leave team | no | yes | yes |
| Delete team | yes | no | no |

The dashboard decides "owner" from the team's owner field. A co-owner sees the same screens as a member.

### Member list

1. Order by join date, oldest first.
2. Each row shows the display name the athlete set in the app, "(You)" for the current user, a role badge and the join date. Rows without a name show "Anonymous User".
3. The owner sees "Make co-owner" or "Make member" and "Remove" on every row except their own.

### Promote and demote

1. Only member and co-owner are assignable. The owner's role cannot change.
2. Setting the current role again succeeds without effect. No confirmation step.

### Remove

1. The owner confirms "Remove Member?".
2. The backend refuses removing oneself and unknown members.
3. The dashboard drops the row from the list without reloading.

### Leave

1. Members and co-owners see "Leave Team" and confirm.
2. The backend refuses the owner with "Team owners cannot leave. Delete the team instead."
3. On success the dashboard returns to team selection.

### Owner checks

Callers outside the team get "team not found", so the backend never confirms that a team exists. Members who are not the owner get "not team owner".

## Structure

A membership links one account to one team with one role and a join date. Each team has exactly one owner membership, matching the team's owner field.

## Open Questions

- Should co-owners see the invite code so they can onboard athletes? Leaning: yes, read-only.
