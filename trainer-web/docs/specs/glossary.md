# Glossary

Terms of the trainer dashboard. Training terms such as workout, focus and points come from the athlete app; its glossary defines them.

## Access

| Term | German | Code | Meaning |
|---|---|---|---|
| Account | Konto | | A login identity. Users create accounts in the athlete app; the dashboard signs existing accounts in. |
| Sign-in code | Anmeldecode | | Six-digit one-time code the dashboard sends by email. The dashboard offers no other sign-in method. |
| Trainer access | Trainerfreigabe | trainer_granted_at | Grant that lets an account create teams and lets its teams' owners and co-owners see athlete training data. An admin grants and revokes it. |
| Admin | Admin | admin_granted_at | Account that may grant and revoke trainer access. A developer sets the flag in the database. |

## Teams

| Term | German | Code | Meaning |
|---|---|---|---|
| Team | Team | | Group of accounts around one trainer. Older texts say "group" or "training group" for the same thing. |
| Owner | Eigentümer | owner | The account that created the team. Exactly one per team. Manages members and invite codes and deletes the team. |
| Co-owner | Co-Eigentümer | co_owner | Member promoted by the owner. Sees athlete training data, manages nothing. |
| Member | Mitglied | member | Account that joined with an invite code. |
| Athlete | Athlet | | A team member with role member. Owner and co-owners are not athletes. |
| Invite code | Einladungscode | | Six-character code of uppercase letters and digits that lets an account join one team. |
| Regenerate | Neu generieren | | Deactivate every active invite code of a team and create one new code. |

## Evaluations

| Term | German | Code | Meaning |
|---|---|---|---|
| Evaluation | Auswertung | | Per-athlete view of completed trainings over a period. |
| Completed training | Absolviertes Training | | One finished workout an athlete synced from the app: date, duration, exercise count, points, moved weight, training type, focus. |
| Period | Zeitraum | | Rolling window an evaluation covers: last week, last month, last year, total. |
| Points | Punkte | XP | Experience points the athlete earned in a workout. |
| Training type | Trainingsart | PLAN, QUICK, PREV | Plan workout, short workout or prevention workout. The dashboard labels the column "Training Phase". |
