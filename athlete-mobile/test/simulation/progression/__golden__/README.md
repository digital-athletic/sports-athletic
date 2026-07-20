# Progression golden tables

Output of the progression simulator, one pair of files per run
(`<persona>-<focus>.<feedback>.{progression,sets}.md`, with the focus as a
readable slug, e.g. `max-strength` for `MAX_KRAFT`), compared by string
equality in `src/features/training/generators/progressionSimulation.spec.ts`.

The simulator only *records* generator output. The level state machine those
records depend on is pinned independently in
`src/features/training/generators/maxLevelTransitions.spec.ts`, which asserts the
raw `getMaxTrainingReps` transition table — so if a golden looks wrong, that test
tells you whether the generator or the simulator changed.

## Reading a file

**progression** has one row per session:

- `weight% before` / `after`: percentage seeding this session / the next one
  (blank when unknown, e.g. session 1).
- `level before` / `after`: rep difficulty level this session / the next one
  (blank on the last session, where no next session was simulated).
- `feedback given`: difficulty the athlete reported this session.
- `feedback applied`: what the adjustment actually persisted; differs from
  `feedback given` when `calculateMaxStrengthAdjustment` overrides it (blank
  means the override cleared the feedback). This value, not `feedback given`,
  seeds the next session.

**sets** has one row per set. `weight%` and `weight kg` are blank for warm-ups
(their loads are assembled elsewhere and not simulated here).

The `<feedback>` in the filename is the scripted difficulty reported every
session: `tooEasy`, `succeeded` ("passt"), or `tooHard`.

## Updating

Regenerate, then review the diff before committing:

```bash
UPDATE_GOLDEN=1 pnpm jest src/features/training/generators/progressionSimulation.spec.ts
```

## Generation inputs

All runs: persona p1, squat (id 26), 4 sessions, seeded squat 1RM 121 kg. They
differ only by the feedback reported each session:

| Files | Feedback | What it shows |
| --- | --- | --- |
| `p1-max-strength.tooEasy.*` | always "zu leicht" | level EASY→HARD→MEDIUM→EASY; one +2.5% bump in 4 sessions |
| `p1-max-strength.succeeded.*` | always "passt" | level EASY→MEDIUM→HARD→EASY; one +2.5% bump in 4 sessions |
| `p1-max-strength.tooHard.*` | always "zu schwer" | level stays EASY; weight drops to the 70% floor |

These are baselines of the current behavior, not correct ones: they show
working set reps rising together with weight instead of falling, and the
weight percentage barely responding to "zu leicht" feedback. Regenerate and
drop the matching `it.failing` in the spec once either defect is fixed.
