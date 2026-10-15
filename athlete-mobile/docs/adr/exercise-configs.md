# ADR: Exercise configs

## Context

The workout generator needs start values, target values and progression steps for every exercise it prescribes. These values come from four places:

| Source | Location | Holds |
|---|---|---|
| Skill trees | `assets/data/generator/skillTrees/` | Which exercises form a branch and at which level |
| Intensity configs | `assets/data/generator/intensity/` | Defaults and rules for one training area (hypertrophy, explosive power, prevention, cardio zones): start and target per gender and fitness level, step sizes per feedback, lowest permitted load |
| Exercise list | `assets/data/generator/Exercises.json` | One exercise: name, media, tags, equipment, its own start and target values where it differs from the training area, and its own conversion factor where the generic equipment conversion does not fit |
| Athlete progress | the exercise progress store on the device | The athlete's last values and rating per exercise |

Without a written rule, readers could not tell which source wins, and some values in the exercise list had no effect.

## Decision drivers

- A rule for a whole training area must change in one place.
- An exercise must be able to differ from its area, for example a heavier start weight for a compound lift.
- The same exercise can appear in several training areas and should get each area's defaults there.
- Values the app never reads should not sit in the data.

## Options

1. **Exercise list only.** Every exercise carries all its values.
2. **Intensity configs only.** Exercises carry no values; the training area decides everything.
3. **Layered.** The intensity config gives the defaults, the exercise list overrides them per exercise, and the athlete's progress overrides both. A config can declare some of its values binding.

## Outcome

Option 3, layered.

The generator resolves a value from the most general to the most specific source, each overriding the one before:

1. intensity config, default
2. intensity config, value for the athlete's gender and fitness level
3. exercise list, default
4. exercise list, value for the athlete's gender and fitness level
5. athlete progress from the last session

Two rules limit the overrides:

- **Binding config values.** A config can make its repetition and duration start and target binding. Hypertrophy, full-body stability and prevention do, because the specs define one central range for each of them. Hypertrophy and full-body stability exercises read the range that matches their equipment (with or without weights).
- **Rules stay in the config.** Step sizes and the lowest permitted load exist only in the intensity config. An exercise contributes at most its start weight, which can lower its lowest permitted load.

A weight given as a percentage of the strength test applies to the barbell 1RM of the exercise's movement direction, converted to the exercise's equipment. The generic factors per equipment sit in code (`MAX_VALUE_CONVERSION_FACTORS` in `src/constants/workoutConstants.ts`). An exercise that authors a `conversionFactor` in the exercise list replaces the generic factor with its own, for example 90% for the barbell incline bench press or 50% per dumbbell for the dumbbell jump squat.

When an athlete moves to another exercise through a level change, the progress of the exercise they leave resets, so a later return starts from the resolved start values. The saved workouts keep the history.

## Pros and cons of the outcome

**Pros**

- A training-area rule changes in one config file.
- Exercises keep their own values where they need them.
- An exercise used in several training areas gets each area's defaults without extra data.

**Cons**

- The precedence is not visible in the data; readers need this document.
- Exercise values can sit in the list without effect when a binding config value overrides them. Exercises used only in hypertrophy, full-body stability or prevention still author repetitions and durations the app ignores.
- The configs are code files while the exercise list is content, so changing a default needs a developer.

## More information

- Specs: `docs/specs/progression/standard-exercise-progression.md`, `docs/specs/progression/weight-calculation-from-strength-tests.md`, `docs/specs/progression/max-strength-progression.md`, `docs/specs/foundations/branches-exercises-and-levels.md`
- Data: `assets/data/generator/intensity/`, `assets/data/generator/skillTrees/`, `assets/data/generator/Exercises.json`, `assets/data/generator/skillPriorities.json` (skills per session length), `assets/data/generator/maxMinutes.json` (maximum minutes per skill group and fitness level), `assets/data/generator/strengthTest.json` (test lifts, test set loads, warm-up region quotas), `assets/data/generator/directions.json` (movement direction sequences per body region and exercise count)
- Data model overview: `docs/data-model.md`
- A maximum of 0 minutes in `maxMinutes.json` passes validation, but the plan generator treats it as unset and falls back to 200 minutes. `MAX` for beginners holds 0 today.
