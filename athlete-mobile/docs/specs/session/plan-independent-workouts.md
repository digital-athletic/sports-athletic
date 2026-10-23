# Plan-Independent Workouts

## Why & What

An athlete can start a workout with no training plan behind it: an on-demand **short workout** or the **strength test**. The short workouts are the app's **focus trainings** (10 to 20 minutes of topic-specific training: leg axis stability, full-body stability, mobility, foam roller, warm-up, cool-down), plus prevention workouts from their own entry point; there is no cardio short workout. Both flows build their candidate pool from the authored **skill trees** and draw at random to a per-type quota, then emit the same **set list** a plan workout emits. This spec defines the quotas, the draw rules, and the conditions under which each flow refuses to build a session.

Focus and prevention workouts follow their own rules defined in this specification, not the plan-mode defaults. Exercise-specific start and target values for repetitions and duration must always be respected.

## Problem

The plan covers the scheduled week. An athlete who wants ten minutes of mobility on a rest day, or who needs a strength test before the next plan exists, has no section, no training day, and no pre-selected branches, so plan-based selection has nothing to filter. The quotas that decide how many exercises such a session holds live in the generator, and so does the authored lift list a strength test runs, which means nobody can review either against an intended structure.

## Solution

Two flows draw straight from the skill trees. A short workout filters the requested type's tree, then draws branches at random until the type's quota is met. A strength test pairs a randomized warm-up with an authored list of test lifts per fitness level.

Both reuse the filter chain and the branch to exercise resolution rule from [Plan Workout Generation](./plan-workout-generation.md), so a blocked branch behaves the same way it does in a plan workout. The handling of an empty pool differs: a plan workout replaces the branch it cannot use, while these flows abort with a typed error naming the cause. Nothing here reads or writes the training plan.

## Out of Scope

- Plan workout generation, the filter chain, and branch to exercise resolution: [Plan Workout Generation](./plan-workout-generation.md)
- Set counts, pause lengths, and warm-up sets: [Session Set Structure](./session-set-structure.md)
- Reference weights for the test lifts, and plate rounding: [Weight Calculation from Strength Tests](../progression/weight-calculation-from-strength-tests.md)
- What pain and soreness mean and how long a report lasts: [Pain, Soreness, and Prevention](../foundations/pain-soreness-and-prevention.md)
- The workout type picker and the place selection screens

## Algorithm

### Short workout

1. Read the bundled AIWL template of the requested type. Each block takes its skill tree names from its skill catalog entry, using the weights-capable variant when the place has weights and the bodyweight variant otherwise. Foam roller sessions require a foam roller or foam ball, else generation fails.
2. Filter by prevention target tag (prevention types only), equipment, age, gender, and the pain exclusion from [Pain, Soreness, and Prevention](../foundations/pain-soreness-and-prevention.md). Soreness filters nothing here, per the same spec. An empty pool after the equipment, age, gender, or pain filter aborts with a typed error naming the cause.
3. Draw each block's picks in template order, uniformly at random, repeating neither a branch nor a resolved exercise. A pick draws defined units from the branches that match its tags. The counts are soft targets and may vary with the available pool. The unit is defined as follows:
   - `exercises`: one unit per exercise.
   - `entries`: one unit per exercise entry in the workout. A two-sided branch adds one entry, a one-sided branch two entries (left and right). A one-sided branch that would exceed the count is skipped.
   - `pairs`: a unit is a superset pair.

| Type | Quota |
|---|---|
| Warm-up, mobility, foam roller, cool-down | 10 exercises, 1 set each; a one-sided branch fills two slots |
| Stability with weights | 4 exercises, any region |
| Stability bodyweight | 3 upper body plus 2 full body (falls back to any region when a quota cannot be met); a one-sided branch fills two slots (left and right) and is skipped when only one slot is left |
| Prevention | 3 special warm-up exercises plus 3 superset pairs; weighted pairs are ordered last |

Prevention and focus trainings skip the superset rules of [Plan Workout Generation](./plan-workout-generation.md): their authored structure fixes the supersets.

### Strength test

1. Athletes under 16 get no strength test; the app offers no menu entry for it.
2. Any reported soreness aborts with a soreness error.
3. Warm-up: random branches from the warm-up tree per authored region quotas, without repeating a branch or a resolved exercise.
4. Test lifts, their order, the ramp-up sets, and the test set: [Weight Calculation from Strength Tests](../progression/weight-calculation-from-strength-tests.md).

The authored lift list in `assets/data/generator/strengthTest.json` names the lifts by exercise id. All three fitness levels use the same five lifts, in this order:

| Exercise id | Lift |
|---|---|
| 25 | Kniebeuge mit LH SWR Level 2 (Squat) |
| 50 | LH Kreuzheben SWR (Deadlift) |
| 342 | LH Bankdruecken SWR (Bench Press) |
| 297 | LH Rudern mit Untergriff SWR (Bent-over Row) |
| 54 | LH Schulterfrontdruecken SWR (Shoulder Press) |

## Structure

These flows read the exercise catalog, the skill trees, and per-branch progress, and never the training plan. Their output is the same set list a plan workout produces, entering the same session store and persisting the same way, so a short workout survives an app restart and resumes where the athlete left it. A finished short workout writes per-exercise progress for the types that progress; [Standard Exercise Progression](../progression/standard-exercise-progression.md) names the ones that do not.

## Open Questions

None.
