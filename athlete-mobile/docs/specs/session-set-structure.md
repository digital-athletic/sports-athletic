# Session Set Structure

## Why & What

Once a session's exercises are selected, the generator expands them into the **set list**: the flat, ordered sequence of work entries and pause entries the athlete steps through. Each skill authors its own set count, its rest lengths, and whether weighted work gets a preparatory set. This spec defines those tables and the expansion rules.

## Problem

The numbers that decide how long a session actually takes (sets per exercise, rest between sets, rest between exercise pairs, extra warm-up sets) live only in code and appear nowhere in the documented model. Two rest values per skill exist without a written rule for when each applies, so a session's real duration cannot be predicted from its plan budget, and a content change cannot be reviewed against an intended structure.

## Solution

Expansion is table-driven and shared by every strength and mobility skill: set count from the skill, alternating work and rest entries, one rest length inside an exercise and a second one closing a superset pair. Rest is a first-class set-list entry rather than a property of the work entry, so the workout UI runs a single timer loop over one homogeneous list.

Three structures sit outside that loop. Weighted hypertrophy and speed strength gain one reduced-weight leading set; Maxkraft brings its own warm-up ladder and fills its long breaks with support exercises; cardio builds intervals from its zone. The last two bypass the tables below entirely.

## Out of Scope

- Which exercises are chosen, how they are paired, and in what order they run (exercise selection spec)
- The prescribed weights, repetitions, and durations themselves (weight calculation and standard exercise progression specs)
- Maxkraft's ladder, its reps per weight, and its support-exercise rules (max strength training spec)
- Cardio interval and pause structure (cardio training system spec)

## Algorithm

### Set count per skill

| Skill | Sets per exercise |
|---|---|
| Maxkraft | 4 |
| Hypertrophy, speed strength, speed endurance, basis, stability, full-body stability, prevention | 2 |
| Warm-up, special warm-up, cool-down, mobility, foam roller | 1 |
| Steady cardio | 1 |
| Interval cardio | interval count, per the cardio spec |

Set counts do not vary by training level today: the level influences the minute budget and the number of exercise slots, not the sets inside a slot.

Maxkraft and cardio are listed for completeness only. Both are emitted by their own builders, which ignore this count and the rest table below and derive their structure from the ladder and the zone respectively.

### Rest lengths

Two values per skill. The **in-set pause** runs between sets of the same exercise and between the two partners of a superset pair. The **after-set pause** runs after the pair's last set, before the next exercise.

| Skill | In-set pause | After-set pause |
|---|---|---|
| Hypertrophy (all variants), basis, prevention | 30 s | 30 s |
| Stability, joint-specific prevention | 30 s | 60 s |
| Full-body stability | 45 s | 45 s |
| Full-body stability, bodyweight | 45 s | 90 s |
| Speed strength | 60 s | 60 s |
| Speed strength, bodyweight | 60 s | 150 s |
| Speed endurance | 75 s | 75 s |
| Speed endurance, bodyweight | 75 s | 180 s |
| Plyometrics | 60 s | 180 s |
| Special warm-up for speed work | 30 s | 30 s |
| Warm-up | 10 s | 30 s |
| Special warm-up, cool-down, mobility, foam roller | 10 s | 10 s |

The after-set column is the value the generator emits, which is not the one it looks up first. It reads a per-skill after-set table (hypertrophy and basis 60 s, full-body stability 90 s, speed strength 150 s, speed endurance 180 s), then overwrites it with the in-set value for every skill that also appears in the superset pause table. Weighted variants appear there and bodyweight variants do not, which is where the split rows above come from; the asymmetry looks accidental rather than authored. A third table of single-set rests exists in the authored content and is never read.

Short workouts skip the lookup entirely and use a flat 10 s after-set pause.

An exercise that found no superset partner never receives an after-set pause at all: every one of its sets, the last included, is followed by the in-set pause.

### Expansion

Per exercise or superset pair, in order:

1. Emit the leading warm-up set when the rules below apply.
2. For each set: emit the lead exercise and its in-set pause, then, with a partner, the partner and its in-set pause.
3. On the last set of a pair, the partner's pause becomes the after-set pause. A solo exercise has no after-set pause.
4. A one-sided exercise emits a left and a right entry per set, and counts as two exercises against its skill's slot quota.
5. Drop the session's trailing pause, so the set list ends on work.

For time budgeting a repetition is estimated at 5 seconds.

### Warm-up sets

| Case | Leading set |
|---|---|
| Hypertrophy pair with at least one weighted exercise | One extra set at 70% of the working weight, working repetitions, rest 30 s paired or 60 s alone |
| Speed strength pair with at least one weighted exercise | One extra set at 65% of the working weight, 8 repetitions, rest 30 s paired or 60 s alone |
| Maxkraft | Two ladder sets at 50% and 75% of the first working weight, 60 s rest (max strength training spec) |
| Everything else | None |

The extra set raises the pair's set count by one, so its numbering runs 1 of 3 rather than warm-up plus 2.

### Example

Hypertrophy pair (weighted bench press with a bodyweight partner), 2 sets:

```text
warm-up bench 70%  | 30 s | partner | 30 s
set 1 bench        | 30 s | partner | 30 s
set 2 bench        | 30 s | partner | 30 s   <- after-set pause, 30 s not 60 s
```

The closing rest is indistinguishable from an in-set rest here, which is the override at work: hypertrophy's authored 60 s never reaches the set list.

## Structure

A skill block owns a set count and its two rest lengths; expansion walks its ordered exercises or pairs and appends entries to the session's set list. Every entry carries its skill, its set index and total, and its prescribed values, which lets the workout UI show progress, drive the timer, and attribute elapsed time to the right skill without consulting the plan. Pause entries reference a placeholder branch, marking them as non-progressing. Unlike the skill trees and start values, these set counts and rest lengths are not authored content: they are hardcoded per-skill switches in the generator, with one partial override table in the bundled content.

## Open Questions

- Set counts by training level are prepared but disabled, so a professional trains the same 2 sets as a beginner. Should professionals gain a set, or is the higher minute budget the intended lever? Leaning toward enabling the level-dependent count for hypertrophy first.
- Warm-up sets are limited to hypertrophy and speed strength. Should speed endurance and full-body stability with weights get one too?
- The after-set override collapses hypertrophy, basis, prevention, full-body stability, speed strength, and speed endurance onto their in-set rest, and splits weighted from bodyweight variants purely by which ones happen to be listed in the superset table. The generator marks that line with a "check if single/super set" TODO and the unused single-set table holds exactly the longer values it discards, so this reads as unfinished rather than intended. Is the longer rest the training model's intent, making the override a bug?
- A solo exercise never gets an after-set pause, so a skill whose exercises mostly fail to find partners runs its entire block on the short in-set rest. Should the unpaired case fall back to the longer rest, as the pairing rules in the exercise selection spec assume?
