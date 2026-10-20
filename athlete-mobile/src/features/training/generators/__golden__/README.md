# Short workout goldens

`shortWorkoutGolden.spec.ts` records the set lists that `TrainingGenerator.generateTraining` returns for the focus and prevention trainings. Later refactors must keep these files byte-equal.

- `shortWorkouts.md`: 13 templates × STUDIO, HOME, HALL × 3 athletes × seeds 1, 7, 42.
- `shortWorkoutsPainSweep.md`: 6 prevention templates × every `PAIN_REGIONS` entry, alone, at STUDIO, seed 42.

Set list encoding: work entries read `exerciseId:skill:set/sets:value:bBranchId` (value is `<n>s` for duration, `<n>x` for repetitions, joined by `+`, or `none`), followed by `:w<weight>` and `:h<height>` when present. Rest entries read `p<seconds>`. A failed generation reads `error <type>/<subtype> <params>`.

The spec seeds `Math.random` with mulberry32 per case and freezes the clock at 2026-01-01 so age groups stay fixed.

## Regenerate

```
UPDATE_GOLDEN=1 pnpm exec jest src/features/training/generators/shortWorkoutGolden.spec.ts
```

Regenerate after any change to `Exercises.json`, the skill trees, `focusTrainings.json`, `intensity.json` or `places.json`, then review the diff. `UPDATE_GOLDEN` is rejected when `CI` is set.
