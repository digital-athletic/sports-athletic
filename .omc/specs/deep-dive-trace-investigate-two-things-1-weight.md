# Deep Dive Trace: investigate-two-things-1-weight

## Observed Result

Two suspicions from the product owner, no concrete example given:

1. Weight progression for short workouts (any training type other than `PLAN` and `TEST_WORKOUT`) may not be stored and used correctly.
2. The statistics weight ("moved weight") seems too high.

All paths below are relative to `athlete-mobile/`.

## Ranked Hypotheses

| Rank | Hypothesis | Confidence | Evidence Strength | Why it leads |
|------|------------|------------|-------------------|--------------|
| 1 | Lane 2: the per-workout formula overcounts moved weight | High for the mechanism, Medium as the full explanation | Strong (real function run in a probe spec, code read) | Only lane with a reproduced wrong number. Skipped and unfinished sets are counted in full. |
| 2 | Lane 3: the code matches the spec and the expectation differs (both topics) | Medium | Moderate (code read, spec text) | Explains topic 1 completely and the part of topic 2 the formula does not explain. No definition of moved weight exists to check against. |
| 3 | Lane 1: short-workout weight is lost between write and read | Low | Strong evidence against (round trip reproduced as working) | Down-ranked: the direct experiment contradicts it. |

## Evidence Summary by Hypothesis

- **Lane 2, formula.** `src/features/training/utils/workoutUtils.ts:188-222`. The exercise list has one entry per set. The function keeps only the entry of the last set (`set[0] === set[1]`), then adds that entry's load x reps once per set. So moved weight = last-set load x last-set reps x number of sets.
  - `skipped` and `completed` are never read. Probe: 4 x 10 at 20 kg, all four sets skipped, gives 800 kg (expected 0). Two of four sets done gives 800 (expected 400).
  - Warm-up sets count at the full working load. Probe: one warm-up at 14 kg plus three sets at 20 kg gives 800 against 740 performed (+8%).
  - The planned weight is counted. No code writes an in-session weight into the list.
  - Constant-load, fully completed workouts are exact (superset probe 1560 = 1560). A max-strength ladder landed within 1% by coincidence.
  - F-Max percentages convert once. Without a strength test the entry counts 0. Bodyweight, pause and test sets add nothing. Units are kg throughout.
- **Lane 3, aggregation and expectation.**
  - No downstream inflation: the save is guarded by a ref (`app/training/training-success.tsx:70,81-102`), the store is keyed by id (`src/store/completedWorkoutsStore.ts`), the server upsert is idempotent (`src/services/SyncService.ts:118-140`), no pull sync exists, and `useWorkoutsData.ts:33-40` adds each workout once.
  - `getWeightString` (`src/utils/formatters.ts:26-30`) is correct.
  - Week, month and year ranges are rolling 7, 30 and 365 days (`src/features/statistics/models/rangeFilter.ts:25-37`), not calendar periods.
  - No spec defines moved weight. The only mention is `docs/adr/final-workout-json-schema.md:124`.
  - Stored `movedWeight` values are never recomputed (`completedWorkoutsStoreMigrations` is empty).
  - Short-workout progression is specified in `docs/specs/progression/standard-exercise-progression.md:26,390-395` and `docs/specs/session/plan-independent-workouts.md:66`: progress is per skill, and WU, MOB, BR, CD never progress.
- **Lane 1, write and read path.**
  - Write and read use the same key, `exerciseProgress[block.skill][exerciseId]` (`hooks/useExerciseCompletion.ts:238`, `workoutGenerator/exerciseValues/exerciseStartValues.ts:139-143`).
  - Probe with the real completion hook and real generation: GKS exercise 80 went 20 to 22.5 kg and the next workout started at 22.5. GKS exercise 100: TOO_HARD at 3 kg gave 2 kg next time. PREV exercise 79: 10 to 12, next 12.
  - Stored weight wins over start values and is not clamped (`exerciseValues.ts:150-155,168-182`).
  - Seven existing suites, 96 tests, pass.

## Evidence Against / Missing Evidence

- **Lane 2.** A fully completed workout is off by 0 to about 10%, which may not match "too high". How often athletes skip or leave sets unfinished is unknown. Dumbbell semantics are unverified: the stored load is multiplied once, and the CSV export labels it "per dumbbell", so a pair may be undercounted. Whether timed exercises put seconds in `repetition` together with a weight was not confirmed.
- **Lane 3.** Git history in this clone starts 2026-11-11, so an older formula behind old stored values cannot be ruled out. No production data was inspected.
- **Lane 1.** BAS, STABILITY, PREVKNEE and MOB had no weighted exercise in the sampled draws. Branch-level changes were not probed separately. No bundled template uses several blocks of the same skill. Things that look like the hypothesis but are by design:
  - WU, MOB, BR, CD store nothing (`skills.json` `progression: false`), although WU can generate a weighted exercise (5 kg, same every time).
  - The WUSPEZIAL warm-up block inside PREV* stores nothing (`constants/workoutConstants.ts:959`).
  - Weight goes up only when the rep or duration target is reached with a rating other than TOO_HARD. A plain TOO_EASY changes reps or duration, never weight. Same rule as plan workouts.
  - Progress under one skill is not carried to another skill, so plan and short workouts do not share a weight for the same exercise.
  - No in-session weight edit exists in the UI.
  - Exercise progress is local only. Nothing reads `user_exercises` back, and the upload is flag-gated (`SyncService.ts:81`). A reinstall loses progress for all workout types.

## Per-Lane Critical Unknowns

- **Lane 1 (short-workout progression lost)**: which concrete behaviour was seen: workout type, exercise, rating, and the weights on consecutive sessions.
- **Lane 2 (formula overcounts)**: the owner's definition of moved weight: performed sets only, warm-ups in or out, a dumbbell pair as one load or two, planned or actual weight.
- **Lane 3 (aggregation and expectation)**: what "too high" is compared against, one workout or the weekly summary, and which reference number was expected.

## Rebuttal Round

- Best rebuttal to leader (from lane 3): the formula is exact for constant loads and within 10% otherwise, so it cannot explain a number that looks clearly too high unless sets were skipped. The cause may be the definition, not arithmetic.
- Why the leader held: the skipped and unfinished set defect is reproduced and can double a workout's number or more. It is a defect under any definition of moved weight. The rebuttal narrows the claim: lane 2 explains "wrong", and only explains "much too high" when sets are skipped or left unfinished.

## Convergence / Separation Notes

- Lanes 2 and 3 converge on topic 2: one formula, no downstream inflation, no written definition. They differ in the next step (fix the formula versus agree the definition), so both stay.
- Lanes 1 and 3 converge on topic 1 through independent evidence (probe and spec): storage and read-back work for the short workouts that progress, and the surprising cases are by design.

## Most Likely Explanation

- **Topic 1.** Weight progression for short workouts is stored and read back correctly for the types that progress (GKS, PREV*, and BAS and STABILITY where weighted). The suspicion most likely comes from a by-design rule: warm-up, mobility, foam roller and cool-down never progress, weight rises only at the rep or duration target, and progress is not shared between skills or between plan and short workouts.
- **Topic 2.** The moved-weight formula is not a sum over performed sets. It multiplies the last set by the number of sets. It counts skipped and unfinished sets in full, counts warm-up sets at working load, and uses planned weights. Nothing after the formula inflates the number.

## Critical Unknown

The concrete case behind each suspicion: which workout, which exercise and which number looked wrong, and what was expected instead. Without it, topic 1 cannot be told apart from a by-design rule, and the size of the topic 2 gap cannot be matched to a cause.

## Recommended Discriminating Probe

Take one real completed workout whose moved weight looked too high. Recompute it from its exercise entries as the sum of load x reps over the sets that were actually done, once with and once without warm-up sets, and compare with the stored `movedWeight`. A gap that disappears when skipped and unfinished sets are excluded confirms lane 2.
