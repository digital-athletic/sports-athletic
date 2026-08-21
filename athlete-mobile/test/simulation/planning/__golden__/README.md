# Plan creation golden table

Spec: `docs/specs/planning/training-plan-creation-from-anamnesis.md`
(section 3, day grouping and focus).
Generate from: `PlanGenerator.getTrainingDayGroupsFocuses`, a directly
callable static. `case`, `athlete`, and `schedule` echo the inputs; `focus
per day` is the returned `FocusType[][]` flattened back onto the weekdays.
The rules are fully deterministic, so no fixture crafting is needed; branch
selection stays out of scope because it draws at random.

Header prefixes: `in:` marks scripted or echoed inputs, `out:` marks
values read from the implementation; unprefixed columns are row
identifiers.

**Status: hand-derived spec targets; the comparison test is not wired yet.**
Do not regenerate with `UPDATE_GOLDEN=1` until a hand-check confirms the
computed table.

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

Derivation note: the spec's per-group day counts are read as the size of the
consecutive-day group, not the weekly total; a Mon plus Wed schedule would be
two one-day groups. If production counts per week instead, that is a spec
conversation, not a silent regeneration.
