# Session Set Structure

## Why & What

Once the generator has selected a session's exercises, it expands them into the **set list**: the flat, ordered sequence of work entries and pause entries the athlete steps through. Each skill authors its own set count, its rest lengths, and whether weighted work gets a preparatory set. This spec defines those tables and the expansion rules.

## Problem

A plan promises 30 minutes of max strength. The time the athlete spends depends on sets per exercise, rest between sets, rest between pairs, and warm-up sets, and no spec records those four numbers. Each skill carries several rest values with no written rule for which one applies where, so a trainer cannot predict a session's real duration, and a reviewer has no intended structure to check a content change against.

## Solution

Every strength and mobility skill expands through the same tables: set count from the skill, alternating work and rest entries, and three rest lengths, each with a single purpose (inside a superset pair, between the sets of an unpaired exercise, closing an exercise block before different muscle groups). Rest gets its own set-list entry, so the workout UI runs a single timer loop over one homogeneous list.

Three structures sit outside that loop. Weighted hypertrophy and explosive power gain one reduced-weight leading set; max strength brings its own warm-up ladder and fills its long breaks with support exercises; cardio builds intervals from its zone. The last two bypass the tables below.

## Out of Scope

- Which exercises are chosen, how they are paired, and in what order they run: [Plan Workout Generation](./plan-workout-generation.md)
- The prescribed weights, repetitions, and durations themselves: [Weight Calculation from Strength Tests](../progression/weight-calculation-from-strength-tests.md) and [Standard Exercise Progression](../progression/standard-exercise-progression.md)
- Max strength's ladder, its reps per weight, and its support-exercise rules: [Max Strength Training](../progression/max-strength-progression.md)
- Cardio interval and pause structure: [Cardio Training System](./cardio-training-system.md)

## Algorithm

### Set count per skill

| Skill | Sets per exercise |
|---|---|
| Max strength | 4 |
| Hypertrophy, explosive power, power endurance, stability, full-body stability, prevention | 2 |
| Warm-up, special warm-up, cool-down, mobility, foam roller | 1 |
| Steady cardio | 1 |
| Interval cardio | interval count, per [Cardio Training System](./cardio-training-system.md) |

Set counts deliberately do not vary by training level: beginners, advanced athletes, and professionals perform the same sets per exercise, and the higher minute budget (more exercise slots) is the mechanism that differentiates the levels. A level-dependent set count may be reviewed later, but is not part of the model.

Max strength and cardio appear here for completeness. Their own builders ignore this count and the rest table below, and derive their structure from the ladder and the zone instead.

### Rest types

Three values per skill, each with its own purpose, never substituted for one another:

- The **in-set pause** runs exclusively within a superset pair: between the two partner exercises, and between the rounds of the same pair.
- The **single-exercise rest** runs between the sets of an exercise without a superset partner.
- The **after-set pause** closes a complete exercise block (a superset pair or a solo exercise).

Which of the last two runs at a block boundary is decided by the transition rule below.

| Skill | In-set pause | Single-exercise rest | After-set pause |
|---|---|---|---|
| Hypertrophy (all variants) | 30 s | 90 s | 60 s |
| Prevention | 30 s | 60 s | 60 s |
| Stability, joint-specific prevention | 30 s | 60 s | 60 s |
| Full-body stability, weighted | 45 s | 90 s | 60 s |
| Full-body stability, bodyweight | 45 s | 90 s | 60 s |
| Explosive power, weighted | 60 s | 180 s | 60 s |
| Explosive power, bodyweight | 60 s | 180 s | 60 s |
| Power endurance, weighted | 75 s | 180 s | 75 s |
| Power endurance, bodyweight | 75 s | 180 s | 75 s |
| Plyometrics | 60 s | 180 s | 60 s |
| Speed warm-up | 30 s | 30 s | 30 s |
| Warm-up | 10 s | 10 s | 30 s |
| Special warm-up, cool-down, mobility, foam roller | 10 s | 10 s | 10 s |

Power endurance is not yet implemented in the training logic; its rest values are specified here for future implementation.

Focus and short workouts use workout-specific fixed rest durations instead of a flat after-set pause: 10 s for warm-up, cool-down, mobility, and foam roller; 30 s for leg-axis stability; and 45 s for full-body stability with or without additional weight.

### Transition after an exercise block

After the final set of an exercise block, exactly one rule applies, checked in order:

1. Last block of the session → no pause; the set list ends on work.
2. The next block trains the same muscle-group category/region (for example, lower body) **and the same primary trained muscle(s)** → single-exercise rest.
3. Otherwise → after-set pause.

Rule 2 applies only when both conditions match: the same muscle-group category/region and the same primary trained muscle(s). A match on the broad region alone is not sufficient. If either the region or the primary trained muscle(s) changes, the regular after-set pause applies. This keeps recovery from being shortened just because the generator moves on to a new exercise. For a superset pair the closing rest follows the partner exercise of the final round; for a solo exercise, its final set. The rest length comes from the finished block's skill.

The transition check is therefore testable as follows:

| Finished block vs. next block | Pause type |
|---|---|
| Same muscle-group category/region **and** same primary trained muscle(s) | Single-exercise rest |
| Same muscle-group category/region, but different primary trained muscle(s) | After-set pause |
| Different muscle-group category/region | After-set pause |
| No next block | No pause |

The check is based on the muscle-group category/region and the primary trained muscle(s), not on the exercise name alone.


### Expansion

Per exercise or superset pair, in order:

1. Emit the leading warm-up set when the rules below apply.
2. Superset pair, per round: emit the lead exercise and the in-set pause, then the partner and the in-set pause. After the final round, the transition rule above replaces that closing in-set pause.
3. Solo exercise, per set: emit the exercise and the single-exercise rest. On the final set, the transition rule replaces the regular single-exercise rest. The in-set pause never appears outside a superset pair, so an exercise that failed to find a partner rests on its skill's single-exercise value, not the short superset pause.
4. A one-sided exercise is emitted in the following order for each set: left → rest → right → rest, and counts as two exercises against its skill's slot quota.

Time budgeting counts a repetition as 4 seconds.

### Warm-up sets

| Case | Leading set |
|---|---|
| Hypertrophy pair with at least one weighted exercise | One extra set at 70% of the working weight, working repetitions, rest 30 s paired or 60 s alone |
| Explosive power pair with at least one weighted exercise | One extra set at 65% of the working weight, 8 repetitions, rest 60 s paired or 180 s alone (the skill's single-exercise rest) |
| Max strength | Two ladder sets at 50% and 75% of the first working weight, 60 s rest ([Max Strength Training](../progression/max-strength-progression.md)) |
| Everything else | None |

No other skill gains a warm-up set: weighted full-body stability deliberately trains without one, and power endurance is not yet implemented. Whether these deserve one is a later review, not part of the model.

The extra set raises the pair's set count by one, so its numbering runs 1 of 3 rather than warm-up plus 2.

### Examples

Hypertrophy pair (weighted bench press with a bodyweight partner), 2 sets, next block trains different muscles:

```text
warm-up bench 70%  | 30 s | partner | 30 s
set 1 bench        | 30 s | partner | 30 s
set 2 bench        | 30 s | partner | 60 s   <- after-set pause
```

Solo hypertrophy exercise, next block trains different muscles:

```text
set 1 | 90 s   <- single-exercise rest
set 2 | 60 s   <- after-set pause
```

Solo hypertrophy exercise, next block trains the same primary muscle group:

```text
set 1 | 90 s   <- single-exercise rest
set 2 | 90 s   <- single-exercise rest again, not the shorter after-set pause
```

## Structure

A skill block owns a set count and its three rest lengths; expansion walks its ordered exercises or pairs and appends entries to the session's set list. Every entry carries its skill, its set index and total, and its prescribed values, which lets the workout UI show progress, drive the timer, and attribute elapsed time to the right skill without consulting the plan. Pause entries reference a placeholder branch, marking them as non-progressing. Unlike the skill trees and start values, these set counts and rest lengths are not authored content: the generator holds them per skill.
