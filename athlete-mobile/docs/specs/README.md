# Training Specs

The training domain, from the athlete's anamnesis to the set list they execute. Folders follow the lifecycle: the model everything reads, then plan creation, then what happens when a workout starts, then how values move between sessions.

## foundations

The shared model. Read these first.

| Spec | Covers |
|---|---|
| [Branches, Exercises, and Levels](./foundations/branches-exercises-and-levels.md) | Skill trees, branches, authored levels, the level decision and branch substitution |
| [Pain, Soreness, and Prevention](./foundations/pain-soreness-and-prevention.md) | The two health signals, their lifetimes, prevention mappings, and the rules that abort a session |

## planning

| Spec | Covers |
|---|---|
| [Training Plan Creation](./planning/training-plan-creation-from-anamnesis.md) | Turning the anamnesis profile into sections, training days, skills, and pre-selected branches |

## session

What the app builds when the athlete presses start.

| Spec | Covers |
|---|---|
| [Plan Workout Generation](./session/plan-workout-generation.md) | Filtering and replacing today's pre-selected branches, pairing, ordering, and the weighted ratio |
| [Plan-Independent Workouts](./session/plan-independent-workouts.md) | On-demand short workouts and the Maxkraft strength test, drawn straight from the skill trees |
| [Session Set Structure](./session/session-set-structure.md) | Set counts, rest lengths, warm-up sets, and how a skill block expands into the set list |
| [Cardio Training System](./session/cardio-training-system.md) | The six zones, interval and steady blocks, heart-rate bands, and interval-count progression |

## progression

How prescribed values move from one session to the next.

| Spec | Covers |
|---|---|
| [Standard Exercise Progression](./progression/standard-exercise-progression.md) | The everyday loop for every skill except Maxkraft and cardio: reps, duration, weight, then level |
| [Max Strength Training](./progression/max-strength-progression.md) | Maxkraft: the F-Max ladder, warm-up sets, repetition tables, and support exercises |
| [Weight Calculation from Strength Tests](./progression/weight-calculation-from-strength-tests.md) | Strength test to 1RM to equipment conversion to training weight to plate rounding |

## Conventions

- Every spec uses the same sections: Why & What, Problem, Solution, Out of Scope, Algorithm, Structure, Open Questions.
- Specs describe algorithms and domain rules, never file paths, function names, or types. They survive a refactor unchanged.
- Cross-references link to the other spec by its title, so a moved file breaks the link rather than leaving a stale name in prose.
- Open Questions names decisions that are genuinely unresolved. "None." is a valid answer.
