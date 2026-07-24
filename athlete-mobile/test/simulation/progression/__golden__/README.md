# Progression golden tables

Target output of the progression simulator, one pair of files per run
(`<persona>-<focus>.<feedback>.{progression,sets}.md`, with the focus as a
readable slug, e.g. `max-strength` for `MAX_KRAFT`), compared by string
equality in `src/features/training/generators/progressionSimulation.spec.ts`.

**These tables encode the values as they SHOULD be** according to
`docs/specs/max-weight-training-progression-logic.md`, hand-derived from the
spec's Advanced-level ladders. The current generator does not produce them
yet, so the golden-comparison tests in the spec file are skipped
(`it.skip.each`). Drop the `.skip` once the generator implements the spec —
and do **not**
regenerate with `UPDATE_GOLDEN=1` until then, since that would overwrite the
spec targets with the current (defective) generator output.

## Reading a file

**progression** has one row per session:

- `weight% before` / `after`: percentage of the last (top) working set seeding
  this session / the next one (blank when unknown, e.g. session 1). Under the
  spec each set progresses along its own ladder, so a single percentage cannot
  reconstruct the other sets; the top set is recorded because it drives the
  end-of-exercise rule.
- `level before` / `after`: buffer column of the last working set this
  session / the next one (blank on the last session, where no next session was
  simulated). Advanced columns map as EASY = 20%, MEDIUM = 15%, HARD = 10%.
- `feedback given`: difficulty the athlete reported this session.
- `feedback applied`: what the adjustment persists. Per the spec there are no
  overrides, so it always equals `feedback given` (a "too heavy" at the 65%
  floor is still applied; the reduction simply clamps).

**sets** has one row per set. For working sets `weight%` is the percentage of
F-Max. For warm-ups it is the percentage of the 1st working set's displayed
weight (spec section 2: 50 and 75), and `weight kg` is that fraction of the
rounded 1st working set load, rounded again per spec section 8. Warm-up reps
are 6 and 5 with 60 s rest; working sets carry the ≈3 min superset block as
`pause s` = 180.

The `<feedback>` in the filename is the scripted difficulty reported every
session: `tooEasy`, `succeeded` ("passt"), or `tooHard`.

## Generation inputs

All runs: persona p2 (tagged `LEVEL_ADVANCED`, matching the spec's restriction
of max strength training to Advanced/Pro), squat (id 26), 4 sessions, seeded
squat 1RM 121 kg. Weights are percentages of that F-Max, rounded to the
nearest 2.5 kg (barbell; exact ties round down): 65% → 77.5, 67.5% → 82.5,
70% → 85, 72.5% → 87.5, 75% → 90, 77.5% → 95, 80% → 97.5.

Warm-up loads derive from the rounded 1st working set (spec section 2):
1st working set 85 kg → 42.5 kg (50%) and 62.5 kg (75%; 63.75 is an exact tie
and rounds down); 77.5 kg (tooHard from session 2 on) → 37.5 kg (38.75 ties
down) and 57.5 kg.

The runs use the spec's Advanced structure (3 working sets starting at
70 / 72.5 / 75%, maxing at 70 / 75 / 80%).

They differ only by the feedback reported each session:

| Files | Feedback | What it shows |
| --- | --- | --- |
| `p2-max-strength.tooEasy.*` | always "zu leicht" | every set advances 2 ladder steps per session, capped at its final step |
| `p2-max-strength.succeeded.*` | always "passt" | every set advances 1 ladder step per session; set 1 parks at 70% × 6 |
| `p2-max-strength.tooHard.*` | always "zu schwer" | all sets drop 5 percentage points per session, floored at 65%, keeping their buffer column |
