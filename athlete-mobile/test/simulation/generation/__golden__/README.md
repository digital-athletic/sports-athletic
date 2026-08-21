# Workout generation golden tables

Spec: `docs/specs/session/plan-workout-generation.md` (big vs small muscle
groups, pairing ranks, the unpaired case).
Generate from: the set list `TrainingGenerator` emits for the fixture pools
below. The generator does not report which rank matched, so the table holds
only observable structure: `unit` is read mechanically off the set list
(alternating exercises form a pair, a repeated single exercise a single
block), `lead` and `partner` are the exercises in emission order.

The pools are crafted so every rank has exactly one best candidate: the
generator's random tie-breaking never fires and the outcome is deterministic
without seeding. Which rank produced each row is documented here, not in the
table.

**Status: hand-derived spec targets without a harness yet.** The harness
needs fixture branches carrying the tags below; keep the comparison skipped
until the generator matches, and do not regenerate with `UPDATE_GOLDEN=1`
before then.

## Fixture pool: `pairing-partner-ranks.md`

Hypertrophy branches, all both-sided, all surviving the filter chain:

| exercise | primary muscle | size | body region | movement |
| --- | --- | --- | --- | --- |
| bench press | chest | big | upper body | horizontal press |
| barbell row | upper back | big | upper body | horizontal pull |
| shoulder press | shoulder | small | upper body | vertical press |
| adductor squeeze | inner thigh | small | lower body | adduction |

Scenario A uses all four, scenario B drops the shoulder press.

What each row asserts:

- Pair 1 (both scenarios): the big-muscle group pairs out first; bench press
  and barbell row match at rank 1 as opposing muscle groups.
- Pair 2 (scenario A): rank 4, small muscles from different body regions.
  This row also locks the new muscle classification: the inner thigh is
  small. Under the old classification the adductor squeeze would have entered
  the big-muscle round and scenario A would pair differently; the table fails
  against that behavior on purpose.
- Single (scenario B): with the shoulder press gone the adductor squeeze
  finds no partner and runs as a single exercise; its single-exercise rest is
  asserted by the set-structure goldens, not here.
