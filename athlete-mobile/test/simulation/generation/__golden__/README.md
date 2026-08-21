# Workout generation golden tables

Spec: `docs/specs/session/plan-workout-generation.md` (big vs small muscle
groups, pairing ranks, the unpaired case).

Two files per run, like the max-strength pairs: `pairing-pool.md` holds the
inputs, `pairing-partner-ranks.md` the outcome.

- `pairing-pool.md`: one row per fixture branch fed to the generator. The
  `in:` columns echo the fixture tags; `out: size` is the generator's own
  classification of the primary muscle (`BIG_MUSCLES` in
  `src/constants/workoutConstants.ts`).
- `pairing-partner-ranks.md`: the pairing outcome, read mechanically off the
  emitted set list (alternating exercises form a pair, a repeated single
  exercise a single block); `lead` and `partner` are the exercises in
  emission order. The generator does not report which rank matched, so the
  rank behind each row is documented below, not in the table.

The pools are crafted so every rank has exactly one best candidate: the
generator's random tie-breaking never fires and the outcome is deterministic
without seeding. Scenario A uses all four branches, scenario B drops the
shoulder press.

Header prefixes: `in:` marks scripted or echoed inputs, `out:` marks
values read from the implementation; unprefixed columns are row
identifiers.

**Status: hand-derived spec targets without a harness yet.** The harness
needs fixture branches carrying the tags in the pool table; keep the
comparison skipped until the generator matches, and do not regenerate with
`UPDATE_GOLDEN=1` before then. Known gap: `BIG_MUSCLES` still carries the old
classification (inner and outer thigh as big), so today's generator would
print `big` for the adductor squeeze and pair scenario A differently; the
pool table encodes the spec's new classification on purpose.

## What each outcome row asserts

- Pair 1 (both scenarios): the big-muscle group pairs out first; bench press
  and barbell row match at rank 1 as opposing muscle groups.
- Pair 2 (scenario A): rank 4, small muscles from different body regions.
- Single (scenario B): with the shoulder press gone the adductor squeeze
  finds no partner and runs as a single exercise; its single-exercise rest is
  asserted by the set-structure goldens, not here.
