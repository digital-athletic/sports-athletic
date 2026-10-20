# Plan-Independent Workouts

## Why & What

An athlete can start a workout with no training plan behind it: an on-demand **short workout** or the **strength test**. The short workouts are the app's **focus trainings** (10 to 20 minutes of topic-specific training: leg axis stability, full-body stability, mobility, foam roller, warm-up, cool-down), plus prevention workouts from their own entry point; there is no cardio short workout. A short workout draws at random from the skill trees that the blocks of its bundled **template** name. The strength test draws its warm-up the same way. Both then emit the same **set list** a plan workout emits. This spec defines the picks and counts, the draw rules, and the conditions under which each flow refuses to build a session.

## Problem

The plan covers the scheduled week. An athlete who wants ten minutes of mobility on a rest day, or who needs a strength test before the next plan exists, has no section, no training day, and no pre-selected branches, so plan-based selection has nothing to filter. The picks and counts of a short workout are stored in its bundled template and skill catalog entry. The authored lift list of a strength test is stored in `strengthTest.json`. A reviewer reads both as data against an intended structure.

## Solution

Two flows draw straight from the skill trees. A short workout reads the bundled template of the requested type and draws each block's picks. A strength test pairs a randomized warm-up with an authored list of test lifts per fitness level.

Both reuse the filter chain and the branch to exercise resolution rule from [Plan Workout Generation](./plan-workout-generation.md), so a blocked branch behaves the same way it does in a plan workout. The handling of an empty pool differs: a plan workout replaces the branch it cannot use, while the flows here abort with a typed error naming the cause. A pick of a short workout that matches no branch draws nothing. Nothing here reads or writes the training plan.

## Out of Scope

- Plan workout generation, the filter chain, and branch to exercise resolution: [Plan Workout Generation](./plan-workout-generation.md)
- Set counts, rest lengths, and warm-up sets: [Session Set Structure](./session-set-structure.md)
- The template and skill catalog formats: [Athletic Intelligence Workout Language](../../adr/athletic-intelligence-workout-language.md) and [Skill catalog](../../adr/skill-catalog.md)
- Reference weights for the test lifts, and plate rounding: [Weight Calculation from Strength Tests](../progression/weight-calculation-from-strength-tests.md)
- What pain and soreness mean and how long a report lasts: [Pain, Soreness, and Prevention](../foundations/pain-soreness-and-prevention.md)
- The workout type picker and the place selection screens

## Algorithm

### Short workout

1. Read the bundled template of the requested type. Each block takes its skill tree names from its skill catalog entry: the `withWeights` names when the training place has weights, the `withoutWeights` names otherwise.
2. Filter the union of the block pools by pains (the exclusion from [Pain, Soreness, and Prevention](../foundations/pain-soreness-and-prevention.md)), equipment, age, and gender, in this order. Soreness filters nothing here, per the same spec. Each filter drops the exercises it does not allow. Equipment decides per exercise, so a place without the equipment for a branch drops that branch alone. An empty pool after any of these filters aborts with a typed error naming the cause.
3. Draw each block's picks in template order, uniformly at random, repeating neither a branch nor a resolved exercise. A pick draws `count` units from the branches that match its tags. `countBy` sets the unit:
   - `exercises`: one unit per exercise.
   - `entries`: one unit per exercise entry in the workout. A two-sided branch adds one entry, a one-sided branch two entries (left and right). A one-sided branch that would exceed the count is skipped.
   - `pairs`: a unit is a superset pair.

   With `fallbackToWholeTree`, a pick that finds too few matches draws the rest from the whole block pool. A pick that runs out of branches draws fewer units. Weighted pairs come last in the block.

| Template | Picks | Count unit | Fallback to whole tree |
|---|---|---|---|
| WU, MOB, BR, CD | 10, any region | entries | no |
| BAS | 4, any region | entries | yes |
| GKS | with weights 4, any region; without weights 3 with the upper body tag plus 2 with the full body tag | entries | yes |
| STABILITY | 6, any region; trees BAS with weights, GKS without | exercises | no |
| PREV, PREVSHOULDER, PREVKNEE, PREVWRIST, PREVANKLE, PREVSPINE | 3 special warm-up exercises of the prevention area, then 3 superset pairs of the prevention skill | exercises, then pairs | no |

Prevention and focus trainings skip the superset rules of [Plan Workout Generation](./plan-workout-generation.md): the template or the catalog entry fixes the superset. Leg axis stability uses `drawOrder`, and prevention uses `drawOrderWithLeftovers`.

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

These flows read the exercise catalog, the bundled templates, the skill catalog, the skill trees, and per-branch progress, and never the training plan. Their output is the same set list a plan workout produces, entering the same session store and persisting the same way, so a short workout survives an app restart and resumes where the athlete left it. A finished short workout writes per-exercise progress for the types that progress; [Standard Exercise Progression](../progression/standard-exercise-progression.md) names the ones that do not.

## Open Questions

None.
