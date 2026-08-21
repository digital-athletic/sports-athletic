# Cardio golden table

Spec: `docs/specs/session/cardio-training-system.md` (zone table, building
the block).
Generate from: the cardio block of the set list (`GeneratedSetListEntry[]`)
that `TrainingGenerator` emits for the scenario below. The `in:` columns echo
the scenario inputs (zone, minute budget, interval count) on every row, like
the session and exercise columns of the max-strength sets tables. `out: kind`
is `pause` when the entry carries the pause exercise id, else `work`;
`out: duration s` is the entry's `duration` field. No zone label or
heart-rate band, because the entry model carries neither; the block structure
and the durations are the logic under test.

Header prefixes: `in:` marks scripted or echoed inputs, `out:` marks
values read from the implementation; unprefixed columns are row
identifiers.

**Status: hand-derived spec targets without a harness yet.** Keep the
comparison skipped until the generator matches, and do not regenerate with
`UPDATE_GOLDEN=1` before then.

## Scenario: `zone2-block.setlist.md`

CARDIO_2 (maximal aerobic power), 20 minute budget, interval count 4 (the
zone's ADVANCED start value), no soreness. This is the spec's own worked
block.

What each entry asserts:

- Entry 1 (300 s): the 5 minute zone-4 warm-up run, prepended because more
  than 5 minutes of budget remain after the intervals.
- Entries 2 to 9: 4 pairs of 60 s work interval and 60 s running pause, the
  zone's authored lengths.
- Entry 10 (420 s): the zone-4 filler run over the remaining budget
  (1200 - 480 - 300).
- Entry 11 (60 s): the closing pause at the zone's pause length.

Derivation notes:

- The closing pause sits outside the minute budget: the spec fills the
  remainder with the filler run and then appends the pause, so the block
  totals 21 minutes. If the intended reading is filler = remainder minus the
  pause, this table changes; flag it against the spec rather than
  regenerating silently.
- Heart-rate bands (162 to 180 bpm for the intervals and 117 to 144 bpm for
  the zone-4 runs at age 30, from max HR = 210 - age) are not in the
  generator's output today; if band computation gets a function seam, they
  become a second generatable table.
