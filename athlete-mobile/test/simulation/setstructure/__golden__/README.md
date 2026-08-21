# Set structure golden tables

Spec: `docs/specs/session/session-set-structure.md` (rest types, transition
rule, expansion, warm-up sets).
Generate from: the set list (`GeneratedSetListEntry[]`) that
`TrainingGenerator` emits for the scenario below, one row per entry in order.

Column mapping, all mechanical:

- `kind`: `pause` when the entry carries the pause exercise id
  (`isPauseExercise`), else `work`.
- `exercise`: the resolved exercise's display name; blank for pauses.
- `set`: the entry's `[currentSet, totalSets]` tuple as "x of y".
- `reps` / `duration s`: the entry's `repetition` / `duration` fields.

The model has no pause-kind label, so which rest type each pause row asserts
is documented here, by entry number, and enforced through the duration.

Header prefixes: `in:` marks scripted or echoed inputs, `out:` marks
values read from the implementation; unprefixed columns are row
identifiers.

**Status: hand-derived spec targets without a harness yet.** The current
generator still applies the after-set override the spec removed, so it will
not reproduce this table. Keep the comparison skipped until it does, and do
not regenerate with `UPDATE_GOLDEN=1` before then.

## Scenario: `hypertrophy-blocks.setlist.md`

One hypertrophy session, 12 repetitions per set, two blocks:

1. Superset pair: weighted bench press (lead) with bodyweight inverted row
   (partner). The weighted lead adds the warm-up set at 70% of the working
   weight, raising the pair's numbering to "of 3"; entry 1 is that warm-up
   set (the model does not mark it, the position and numbering do).
2. Solo squat with no superset partner, different primary muscle than
   block 1, last block of the session.

What each pause asserts:

- Entries 2 to 10 (30 s): the in-set pause, strictly inside the superset
  pair, between partners and between rounds.
- Entry 12 (60 s): the after-set pause closing the pair, because the next
  block trains a different primary muscle.
- Entry 14 (90 s): the single-exercise rest between the sets of the unpaired
  squat, never the shorter superset pause.
- No entry 16: the session's trailing pause is dropped, the list ends on
  work.

Derivation notes:

- Set numbering: the spec raises the pair's set count by one for the warm-up
  set; both partners are numbered "of 3" here. If production numbers the
  partner "of 2", adjust the golden once, deliberately.
- Weights are omitted: prescribed loads belong to the weight-calculation and
  progression specs.
