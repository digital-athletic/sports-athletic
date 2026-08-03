# Session Set Structure

## Why & What

Once the generator has selected a session's exercises, it expands them into the **set list**: the flat, ordered sequence of work entries and pause entries the athlete steps through. Each skill authors its own set count, its rest lengths, and whether weighted work gets a preparatory set. This spec defines those tables and the expansion rules.

## Problem

A plan promises 30 minutes of Maxkraft. The time the athlete spends depends on sets per exercise, rest between sets, rest between pairs, and warm-up sets, and no spec records those four numbers. Each skill carries two rest values with no written rule for which one applies where, so a trainer cannot predict a session's real duration, and a reviewer has no intended structure to check a content change against.

## Solution

Every strength and mobility skill expands through the same tables: set count from the skill, alternating work and rest entries, one rest length inside an exercise and a second closing a superset pair. Rest gets its own set-list entry, so the workout UI runs a single timer loop over one homogeneous list.

Three structures sit outside that loop. Weighted hypertrophy and speed strength gain one reduced-weight leading set; Maxkraft brings its own warm-up ladder and fills its long breaks with support exercises; cardio builds intervals from its zone. The last two bypass the tables below.

## Out of Scope

- Which exercises are chosen, how they are paired, and in what order they run: [Plan Workout Generation](./plan-workout-generation.md)
- The prescribed weights, repetitions, and durations themselves: [Weight Calculation from Strength Tests](../progression/weight-calculation-from-strength-tests.md) and [Standard Exercise Progression](../progression/standard-exercise-progression.md)
- Maxkraft's ladder, its reps per weight, and its support-exercise rules: [Max Strength Training](../progression/max-strength-progression.md)
- Cardio interval and pause structure: [Cardio Training System](./cardio-training-system.md)

## Algorithm

### Set count per skill

| Skill | Sets per exercise |
|---|---|
| Maxkraft | 4 |
| Hypertrophy, speed strength, speed endurance, basis, stability, full-body stability, prevention | 2 |
| Warm-up, special warm-up, cool-down, mobility, foam roller | 1 |
| Steady cardio | 1 |
| Interval cardio | interval count, per [Cardio Training System](./cardio-training-system.md) |

Set counts do not vary by training level today: the level influences the minute budget and the number of exercise slots, not the sets inside a slot.

Maxkraft and cardio appear here for completeness. Their own builders ignore this count and the rest table below, and derive their structure from the ladder and the zone instead.

### Rest lengths

Two values per skill. The **in-set pause** runs between sets of the same exercise and between the two partners of a superset pair. The **after-set pause** runs after the pair's last set, before the next exercise.

| Skill | In-set pause | After-set pause | Authored after-set, discarded |
|---|---|---|---|
| Hypertrophy (all variants), basis | 30 s | 30 s | 60 s |
| Prevention | 30 s | 30 s | longer, value unrecorded |
| Stability, joint-specific prevention | 30 s | 60 s | |
| Full-body stability, weighted | 45 s | 45 s | 90 s |
| Full-body stability, bodyweight | 45 s | 90 s | |
| Speed strength, weighted | 60 s | 60 s | 150 s |
| Speed strength, bodyweight | 60 s | 150 s | |
| Speed endurance, weighted | 75 s | 75 s | 180 s |
| Speed endurance, bodyweight | 75 s | 180 s | |
| Plyometrics | 60 s | 180 s | |
| Special warm-up for speed work | 30 s | 30 s | |
| Warm-up | 10 s | 30 s | |
| Special warm-up, cool-down, mobility, foam roller | 10 s | 10 s | |

The third column is what the generator emits and the fourth is what the skill authors, for the six skills where the two disagree. The generator looks up the authored value, then overwrites it with the in-set value for every skill that also appears in the superset pause table; weighted variants appear there and bodyweight variants do not, which splits those rows in two. A blank fourth cell means the emitted value is the authored one. A third authored table of single-set rests holds the same discarded values, and nothing reads it.

Short workouts skip the lookup and use a flat 10 s after-set pause.

An exercise that found no superset partner never receives an after-set pause: the in-set pause follows every one of its sets, the last included.

### Expansion

Per exercise or superset pair, in order:

1. Emit the leading warm-up set when the rules below apply.
2. For each set: emit the lead exercise and its in-set pause, then, with a partner, the partner and its in-set pause.
3. On the last set of a pair, the partner's pause becomes the after-set pause. A solo exercise has no after-set pause.
4. A one-sided exercise emits a left and a right entry per set, and counts as two exercises against its skill's slot quota.
5. Drop the session's trailing pause, so the set list ends on work.

Time budgeting counts a repetition as 5 seconds.

### Warm-up sets

| Case | Leading set |
|---|---|
| Hypertrophy pair with at least one weighted exercise | One extra set at 70% of the working weight, working repetitions, rest 30 s paired or 60 s alone |
| Speed strength pair with at least one weighted exercise | One extra set at 65% of the working weight, 8 repetitions, rest 30 s paired or 60 s alone |
| Maxkraft | Two ladder sets at 50% and 75% of the first working weight, 60 s rest ([Max Strength Training](../progression/max-strength-progression.md)) |
| Everything else | None |

The extra set raises the pair's set count by one, so its numbering runs 1 of 3 rather than warm-up plus 2.

### Example

Hypertrophy pair (weighted bench press with a bodyweight partner), 2 sets:

```text
warm-up bench 70%  | 30 s | partner | 30 s
set 1 bench        | 30 s | partner | 30 s
set 2 bench        | 30 s | partner | 30 s   <- after-set pause, 30 s not 60 s
```

The closing rest looks the same as an in-set rest here, which is the override at work: hypertrophy's authored 60 s never reaches the set list.

## Structure

A skill block owns a set count and its two rest lengths; expansion walks its ordered exercises or pairs and appends entries to the session's set list. Every entry carries its skill, its set index and total, and its prescribed values, which lets the workout UI show progress, drive the timer, and attribute elapsed time to the right skill without consulting the plan. Pause entries reference a placeholder branch, marking them as non-progressing. Unlike the skill trees and start values, these set counts and rest lengths are not authored content: the generator holds them per skill, with one partial override table in the bundled content.

## Open Questions

- The set count ignores training level today, so a professional trains the same 2 sets as a beginner. Should professionals gain a set, or is the higher minute budget the intended lever? Leaning toward a level-dependent count for hypertrophy first.
- Hypertrophy and speed strength get a warm-up set and no other skill does. Should speed endurance and full-body stability with weights get one too? Leaning yes for their weighted variants.
- The after-set override collapses six skills onto their in-set rest and splits weighted from bodyweight variants by which ones happen to appear in the superset table. The unused single-set table holds the longer values the override discards, which reads as unfinished. Is the longer rest the training model's intent, making the override a bug? Leaning yes.
- A solo exercise never gets an after-set pause, so a skill whose exercises often fail to find partners runs its entire block on the short in-set rest. Should the unpaired case fall back to the longer rest, as the pairing rules in [Plan Workout Generation](./plan-workout-generation.md) assume? Leaning yes.
