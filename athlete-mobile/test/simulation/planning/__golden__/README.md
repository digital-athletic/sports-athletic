# Plan creation golden table

Spec: `docs/specs/planning/training-plan-creation-from-anamnesis.md`
(section 3, day grouping and focus).
Checked by: `src/features/training/planGenerator/stages/dayGroupingAndFocus.golden.spec.ts`.
The test reads `athlete` and `schedule` of every case through
`test/simulation/planning/dayFocusTable.ts`, runs `assignTrainingDayFocus`
and compares the result, Monday first, with `focus per day`. The rules are
fully deterministic, so no fixture crafting is needed; branch selection stays
out of scope because it draws at random.

Header prefixes: `in:` marks scripted or echoed inputs, `out:` marks
values read from the implementation; unprefixed columns are row
identifiers.

**Status: hand-derived spec targets.** The test never writes this table, so a
failing case means the stage or the derivation is wrong; decide which by
hand.

Schedule notation: `<weekday> <place> <minutes> min run equipment` or
`... no run equipment`. Run equipment belongs to the training place, so all
days at one place in a case must agree.

## Cases: `day-focus.md`

All cases with an explicit schedule; consecutive active days form one group,
and the group size selects the adult rule.

- `single day`: a one-day group gets PHASE; the week-wide cardio guarantee
  only applies to adults training more than once, so PHASE stands.
- `two days, guarantee`: Mon and Tue form one group of two. PHASE goes to the
  studio day (Mon); the other day would get CARDIO with run equipment but Tue
  has none, so it gets STABILITY. That leaves the week without CARDIO, so the
  guarantee converts the long PHASE day: Mon is at least 45 minutes with run
  equipment, so it becomes COMBINED rather than plain CARDIO.
- `three days`: one group of three assigns PHASE, CARDIO, STABILITY. PHASE
  prefers the longest studio day (Mon); CARDIO prefers non-home and needs run
  equipment (Tue); the home day without run equipment takes STABILITY. The
  guarantee is satisfied, nothing converts.
- `child`: children always get PHASE, regardless of grouping and equipment.
- `Sunday into Monday`: Sun and Mon form one group of two, because grouping
  wraps across the week boundary. PHASE goes to the studio day (Mon); Sun is
  outside with run equipment and gets CARDIO, so the guarantee is satisfied.
  Without the wrap, both days would be one-day groups with PHASE, and the
  guarantee would turn Mon into COMBINED.
- `four days`: Mon to Thu form one group of four, which cycles PHASE, CARDIO,
  STABILITY in weekday order regardless of place, so Thu starts the next
  cycle with PHASE. Tue holds CARDIO, so the guarantee converts nothing.

Derivation note: the spec's per-group day counts are read as the size of the
consecutive-day group, not the weekly total; a Mon plus Wed schedule would be
two one-day groups. If production counts per week instead, that is a spec
conversation, not a silent regeneration.
