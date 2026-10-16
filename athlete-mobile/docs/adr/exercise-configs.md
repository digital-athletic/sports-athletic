# ADR: Exercise configs

## Context

The workout generator needs start values, target values and progression steps for every exercise. These values can come from the training area (for example hypertrophy or prevention), from the exercise itself, or from the athlete's last session. Without a rule, nobody can tell which source wins.

## Decision drivers

- A rule for a whole training area changes in one place.
- An exercise can differ from its training area where it needs to.
- An exercise used in several training areas gets each area's defaults there.

## Options

1. Every exercise carries all its values.
2. The training area decides everything.
3. Layered: the training area sets defaults, the exercise overrides them, the athlete's progress overrides both.

## Outcome

Option 3, layered. The generator reads each value in this order and takes the first one that is set:

| Value | 1st | 2nd | 3rd |
|---|---|---|---|
| Repetitions, duration | athlete progress | exercise | training area |
| Repetitions, duration in a binding training area | athlete progress | training area | none |
| Weight | athlete progress | exercise | training area |
| Step sizes | training area | none | none |
| Lowest permitted load (weights as a share of the strength test) | training area, lowered to the exercise's start weight if that is lower | none | none |
| Conversion to the equipment | exercise's own factor | generic factor of the equipment | none |

Within the exercise and within the training area, a value for the athlete's gender and fitness level beats one for the gender only, which beats one for the fitness level only, which beats the default.

Rules:

- **Missing data:** an empty value counts as not set, so the next source in the row applies. When no source holds a value, the exercise has none, for example no weight for a bodyweight exercise.
- **Binding training areas:** hypertrophy, full-body stability and prevention make their repetition and duration range binding. Their exercises' own repetitions and durations are ignored. Weights still come from the exercise.
- **Progress in range:** athlete progress is clamped to the current start and target, so a changed range reaches every athlete at the next session.
- **Level change:** the progress of the exercise the athlete leaves resets; the new exercise starts from its resolved start values.

## Pros and cons

- Pro: a training-area rule changes in one place, and exercises keep their own values where needed.
- Con: the precedence is not visible in the data; readers need this document.
- Con: exercise values can sit unused where a binding range overrides them.

## More information

Specs: Standard Exercise Progression, Weight Calculation from Strength Tests, Branches, Exercises, and Levels.
