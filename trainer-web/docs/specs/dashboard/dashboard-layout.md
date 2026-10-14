# Dashboard Layout

## Why & What

The team dashboard groups everything a user does inside one team into tabs. Around the tabs, every page shares a header, a legal footer and one language. This spec defines the tabs, the development tools tab, and the shared page frame.

## Problem

A build flag hides one tab, and the language ignores the browser setting. A trainer who misses the settings tab or English texts cannot tell from the screen why.

## Solution

Every team member sees the same tabs; the content inside each tab differs by role. A build flag adds a settings tab with development tools. The interface runs in German only.

## Out of Scope

- Tab contents: [Team Lifecycle](../teams/team-lifecycle.md), [Members and Roles](../teams/members-and-roles.md), [Invite Codes and Joining](../teams/invite-codes-and-joining.md), [Athlete Evaluations](../evaluations/athlete-evaluations.md)
- Sign-in and page guards: [Sign-In](../access/sign-in.md)

## Rules

### Opening a team

1. The dashboard address carries the team id. Without one, the dashboard returns to team selection.
2. A team the user cannot see shows "You are not a member of any team yet".
3. The dashboard opens on team management. The tab choice resets when the user leaves the page.
4. On narrow screens the tab bar collapses into a dropdown showing the active tab.

### Tabs

| Tab | Shown |
|---|---|
| Team management | always |
| Evaluations | always |
| Settings | only when the debug settings flag is on at build time |

### Settings tab

The settings tab generates example data. One click writes three completed trainings for the signed-in user, dated 180 days ago, 15 days ago and now, one per training type. Each click adds three more. The flag stays off in production.

### Page frame

| Element | Rule |
|---|---|
| Header | Sports Athletic logo and name, linking to team selection; logout when signed in |
| Footer | Imprint and privacy policy of the operator (new tab), and the third-party licence page |
| Third-party licences | Public page listing name, version and licence of each runtime dependency |
| Language | German; English translations exist but no switch selects them |

## Structure

Pages: login, team selection, team dashboard, admin, third-party licences. The team dashboard holds the tabs; the other pages stand alone.

## Open Questions

- The example data belongs to the signed-in user, who is the owner and therefore no athlete, so it never appears in evaluations. Should the tool write data for an athlete of the team? Leaning: yes.
- Should the dashboard offer English? Options: browser detection, a switch, or delete the English bundle. Leaning: browser detection.
