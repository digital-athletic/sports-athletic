# ADR: Exercise configs

## Context

The workout generator needs start values, target values and step sizes for every exercise. These values can come from the skill (for example hypertrophy or prevention), from the exercise itself, or from the athlete's progression. Without a rule, nobody can tell which source wins.

## Decision drivers

- A rule for a whole skill changes in one place.
- An exercise can differ from its skill where it needs to.
- An exercise used in several skills gets each skill's defaults there.
- One exercise can run differently depending on its skill, for example with the hypertrophy repetition range in hypertrophy and the prevention range in prevention.

## Options

1. Every exercise carries all its values.
2. The skill decides everything.
3. Layered: the skill sets defaults, the exercise overrides them, the progression overrides both.

## Outcome

Option 3, layered. The generator reads each value from these sources in order and takes the first one that is set:

| Value | Sources |
|---|---|
| Repetitions, duration | progression → exercise → skill; with a skill override: progression → skill |
| Weight | progression → exercise → skill |
| Step size: how many repetitions or seconds one step adds | skill |
| Step size for weight | none: a fixed rule, see below |
| Lowest load for a percentage of F-Max | skill, lowered to the exercise's start value when that start is a percentage of F-Max and lower |
| Conversion to F-Max | exercise's own factor → generic factor of the equipment |

Within the exercise and within the skill, a value for the athlete's gender and fitness level beats one for the gender only, which beats one for the fitness level only, which beats the default. Step sizes skip the gender-only value.

Rules:

- **Skill override:** a skill can override the repetitions and duration of its exercises with its own range. The skill override exists because some skills require one exercise to run differently than it does elsewhere. The rotating side plank on the forearms, for example, belongs to hypertrophy, full-body stability and prevention, and runs with each skill's range there. With a skill override, the generator ignores the repetitions and duration stored on the exercise and reads them from the progression, then from the skill. Hypertrophy, full-body stability and prevention use a skill override. Weights still come from the exercise.
- **Shared progression:** the app stores one progression per exercise. An exercise in several skills carries its progression from one skill to the next, and the generator clamps it to the range of the current skill.
- **Weight step:** a weight step multiplies the underlying weight by 1.025 or 0.975, as the Standard Exercise Progression spec defines. The app holds this value as a constant and reads no step size for weight from the skill or the exercise. Weight step sizes in a skill config have no effect. The step stops at the target weight on the way up and at the lowest load on the way down. Max strength follows its own ladder.
- **Rounding:** the athlete sees the weight rounded to a loadable value, as the Weight Calculation from Strength Tests spec defines. The app stores both the unrounded and the performed weight, and the next weight step starts from the unrounded weight. The Standard Exercise Progression spec defines the case where a step rounds to the same load.
- **Missing data:** an empty value or 0 counts as not set, so the next source applies. When no source holds repetitions or duration, the generator falls back to built-in defaults of 8 repetitions or 30 seconds; cardio has its own defaults. When no source holds a weight, the exercise trains without one. Only exercises with weights as equipment get a start weight.
- **Progression in range:** at each session and after each feedback step, the generator clamps the athlete's repetitions and duration to the current start and target values, so a changed range reaches every athlete. The clamp leaves the weight untouched. Max strength, warm-up, speed warm-up, special warm-up, cool-down, mobility, foam roller and the test skip the clamp.
- **Level up, level down:** when the athlete moves to another exercise of the branch, the progression of the exercise the athlete leaves resets. The new exercise continues its own stored progression, or begins at its start values when it has none. When the branch holds no other exercise, the progression stays.

## Pros and cons

- Pro: a skill rule changes in one place, and exercises keep their own values where needed.
- Pro: the skill override lets one exercise serve several skills with different repetition ranges.
- Con: the precedence is not visible in the data; readers need this document.
- Con: exercise values stay unused where a skill override replaces them.
- Con: weight step sizes and height step sizes in the skill configs have no effect.

## More information

Specs: Standard Exercise Progression, Weight Calculation from Strength Tests, Branches, Exercises, and Levels.
