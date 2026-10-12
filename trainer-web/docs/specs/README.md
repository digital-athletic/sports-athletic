# Trainer Dashboard Specs

The trainer dashboard, from sign-in to the athlete evaluations. Folders follow the path a trainer takes: get access, set up a team, then follow the athletes in it.

The [Glossary](./glossary.md) defines the terms the specs use. Training terms come from the athlete app's glossary.

## access

Who enters the dashboard and what they may do.

| Spec | Covers |
|---|---|
| [Sign-In](./access/sign-in.md) | Email sign-in code, error messages, page guards |
| [Trainer Access and Admin](./access/trainer-access-and-admin.md) | Trainer and admin flags, the admin page, effects of revoking trainer access |

## teams

| Spec | Covers |
|---|---|
| [Team Lifecycle](./teams/team-lifecycle.md) | Team selection, creating and deleting a team |
| [Invite Codes and Joining](./teams/invite-codes-and-joining.md) | Code format, regeneration, join checks |
| [Members and Roles](./teams/members-and-roles.md) | Owner, co-owner and member rights, member list, removing and leaving |

## evaluations

| Spec | Covers |
|---|---|
| [Athlete Evaluations](./evaluations/athlete-evaluations.md) | Data visibility, periods, totals, the completed trainings list |

## dashboard

| Spec | Covers |
|---|---|
| [Dashboard Layout](./dashboard/dashboard-layout.md) | Tabs, the development tools tab, header, footer, language |

## Conventions

- Every spec uses the same sections: Why & What, Problem, Solution, Out of Scope, Rules, Structure, Open Questions. The athlete app's specs name the fifth section Algorithm because they describe calculations; the dashboard specs describe permissions and validation, so they use Rules.
- Specs describe behaviour and domain rules, never file paths, function names, or types. They survive a refactor unchanged.
- Cross-references link to the other spec by its title, so a moved file breaks the link rather than leaving a stale name in prose.
- Open Questions names unresolved decisions with options and a leaning. "None." is a valid answer.
