# Progression golden tables

Target output of the progression simulator, one pair of files per run
(`<persona>-<focus>.<feedback>.{progression,sets}.md`, with the focus as a
readable slug, e.g. `max-strength` for `MAX_KRAFT`), compared by string
equality in `src/features/training/generators/progressionSimulation.spec.ts`.

**These tables encode the values as they SHOULD be** according to
`docs/specs/progression/max-strength-progression.md`, hand-derived from the
spec's Advanced-level ladders. Do not regenerate them with `UPDATE_GOLDEN=1`
to make a failing comparison pass; a mismatch means the generator drifted
from the spec.

## Reading a file

Header prefixes: `in:` marks scripted or echoed inputs, `out:` marks values
read from the implementation; unprefixed columns are row identifiers.

**progression** has one row per session:

- `weight% before` / `after`: percentage of the last (top) working set seeding
  this session / the next one (blank when unknown, e.g. session 1). Under the
  spec each set progresses along its own ladder, so a single percentage cannot
  reconstruct the other sets; the top set is recorded because it drives the
  end-of-exercise rule.
- `level before` / `after`: buffer column of the last working set this
  session / the next one. Advanced columns map as EASY = 20%, MEDIUM = 15%,
  HARD = 10%. A session's `level after` is only observable by generating the
  following session, so the simulator always runs one session past the
  requested count and drops that extra row; the last recorded session
  therefore still has a value.
- `feedback given`: difficulty the athlete reported this session.
- `feedback applied`: what the adjustment persists. Per the spec there are no
  overrides, so it always equals `feedback given` (a "too heavy" at the 65%
  floor is still applied; the reduction simply clamps).
- `branch level`: `up` or `down` when the adjustment asks production to change
  the branch level, which swaps the exercise (spec section 6). Blank in every
  target row: the spec keeps each run on the same exercise for all four
  sessions. An `up` or `down` in actual output therefore means the run stopped
  describing what the app would do from that session on, since the simulator
  does not model the swap.

**sets** has one row per set. For working sets `weight%` is the percentage of
F-Max. For warm-ups it is the percentage of the 1st working set's displayed
weight (spec section 2: 50 and 75), and `weight kg` is that fraction of the
rounded 1st working set load, rounded again per spec section 8. Warm-up reps
are 6 and 5.

`pause s` is the whole gap to the next set of the same exercise, support-set
work included: 60 s between the warm-ups and the ≈3 min support exercise block
between working sets (spec section 7). After the closing set it is the 2 min
rest that follows a max strength exercise, before the next exercise starts.

The `<feedback>` in the filename is the scripted difficulty reported every
session: `tooEasy`, `succeeded` ("passt"), or `tooHard`.

## Generation inputs

All runs: persona p2 (tagged `LEVEL_ADVANCED`, matching the spec's restriction
of max strength training to Advanced/Pro), squat (id 26), 4 sessions, seeded
squat 1RM 121 kg. Weights are percentages of that F-Max, rounded to the
nearest 2.5 kg (barbell; exact ties round down): 65% → 77.5, 67.5% → 82.5,
70% → 85, 72.5% → 87.5, 75% → 90, 77.5% → 95, 80% → 97.5.

Warm-up loads derive from the rounded 1st working set (spec section 2), at 50%
and 75% of it, rounded the same way: 85 kg → 42.5 and 62.5 kg (63.75 is an
exact tie and rounds down); 82.5 kg (tooHard session 2) → 40 kg (41.25 ties
down) and 62.5 kg; 77.5 kg (tooHard from session 3 on) → 37.5 kg (38.75 ties
down) and 57.5 kg.

The runs use the spec's Advanced structure (3 working sets starting at
70 / 72.5 / 75%, maxing at 70 / 75 / 80%).

They differ only by the feedback reported each session:

| Files | Feedback | What it shows |
| --- | --- | --- |
| `p2-max-strength.tooEasy.*` | always "zu leicht" | every set advances 2 ladder steps per session, capped at its final step |
| `p2-max-strength.succeeded.*` | always "passt" | every set advances 1 ladder step per session; set 1 parks at 70% × 6 |
| `p2-max-strength.tooHard.*` | always "zu schwer" | all sets drop 2.5 percentage points per session, floored at 65%, keeping their buffer column |

## Standard progression: `p2-hypertrophy.mixed.progression.md`

Spec: `docs/specs/progression/standard-exercise-progression.md`.
Generate from: `simulateProgression` once it drives a hypertrophy focus; every
column is scripted input (`reps achieved`, `feedback given`) or prescribed
state read off the generated sessions (`reps next` and `weight% next` come
from generating one session further, like the max-strength runs). The
simulator does not drive this focus yet, so there is no comparison test to
skip. Unlike the max-strength runs, the script varies the achieved reps per
session to hit all three zones of the decision tree.

Inputs: persona p2 (MALE, ADVANCED), one weighted advance-by-reps hypertrophy
exercise with the spec's worked-example bounds, start 12 reps at 65% of F-Max,
target 20 reps at 80%. Because p2 is male and advanced, the repetition steps
come from the gendered hypertrophy row (too easy +3, succeeded +2, too
hard -2), not the base row the spec's own worked example uses. Weight steps
are the F-Max row: +5 / +2.5 / -2.5.

- Session 1: 14 reps lands between start and target, so nothing changes now;
  the next generation applies SUCCEEDED to every quantity (reps 14+2, weight
  65+2.5).
- Session 2: 20 reps reaches the target with the weight below its target, so
  the weight rises one step immediately and reps reset to the start value.
  Immediate actions clear any feedback, so none is recorded.
- Session 3: 10 reps falls below the start with the weight above its start,
  so the weight drops one step and reps reset again.
- Session 4: between zone with TOO_EASY, deferred: reps 15+3, weight 67.5+5.

