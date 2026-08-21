# Weight calculation golden table

Spec: `docs/specs/progression/weight-calculation-from-strength-tests.md`
(sections 1, 3, 4, 6).
Generate from: `maxWeightByEpley` → `calculateAdjustedMaxValues` →
`deriveWeightForExercise` / `roundWeightValue` in
`src/features/training/utils/workoutUtils.ts`.

One row per case, each column a function output or an input echo:

- `test kg`, `test reps`, `intensity %`, `direction`: inputs, echoed.
- `1RM kg`: `maxWeightByEpley(test kg, test reps)`.
- `adjusted max kg`: `calculateAdjustedMaxValues(1RM)[equipment key]`; the
  key column uses the function's own field names.
- `prescribed kg`: `roundWeightValue((intensity % / 100) × adjusted max)`,
  which is `deriveWeightForExercise`'s `weightFMax` path.

Numbers are printed to at most two decimals by the adapter; only
`prescribed kg` is spec-rounded (0.5 kg up to 25 kg, 1 kg up to 100 kg,
2.5 kg above).

**Status: hand-derived spec targets; the comparison test is not wired yet.**
Do not regenerate with `UPDATE_GOLDEN=1` until a hand-check confirms the
computed table.

## Cases

- `epley`: the spec's own example, 80 kg × 8 reps. Hypertrophy 70% lands mid
  range, 1 kg rounding.
- `epley single rep`: at 1 rep the test weight is the 1RM (the function's
  `repetition <= 1` branch).
- `dumbbell per hand`: same 1RM through the 45% conversion.
- `mid range rounding`: squat test 110 kg × 3 gives the exact 1RM 121 used by
  the max-strength goldens, tying the two golden sets to one athlete.
- `small load rounding`: `oneSidedLowerSupported` (30%) at speed strength 50%
  falls below 25 kg, so the 0.5 kg step applies (18.15 rounds to 18).
- `heavy load rounding`: 112 kg is above 100 kg, so the 2.5 kg step rounds up
  to 112.5.

## Not covered yet

The spec's variant adjustments (incline bench 1RM minus 7.5 kg, jump squat
start weight from body weight) have no identified function seam in
`workoutUtils.ts`, so they cannot be generated and compared yet. Add rows
once the implementing functions exist or are located.

The max-strength spec carries its own barbell rounding (2.5 kg steps, exact
ties down) that disagrees with the plate table here; these cases deliberately
avoid max-strength intensities.
