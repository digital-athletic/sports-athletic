# ADR: Skill catalog

## Context

An [AIWL](./athletic-intelligence-workout-language.md) block names a skill, for example `GKS` or `PREVSHOULDER`. The generator needs more about that skill than its code: the skill trees to draw from, the intensity, the focus area for the stats, and the sets, rests, and supersets of its blocks.

Each bundled training repeated these values for its skill. Plan workouts read the sets, rests, and supersets from `TrainingGenerator` methods such as `getSetCountBySkill` and `getAfterSetPauseBySkill`. One skill appears in both places, for example full body stability in a plan day and in the bundled GKS training. Without one source per skill, a template has to repeat the skill's values, and the two places drift apart.

## Decision drivers

- A template describes the workout and nothing else, so a block names its skill and stays short.
- A skill property such as the intensity changes in one place and reaches plan days, bundled trainings, and trainer workouts alike.
- A template can still differ from its skill where a workout needs it, for example the shorter rests of focus trainings.
- A trainer composing a workout cannot set a wrong skill tree or intensity.

## Options

1. Every template carries all skill values.
2. The generator code decides everything, as plan workouts do today.
3. A skill catalog: one data entry per skill code holds the skill properties and block defaults, and a block overrides only the defaults.

## Outcome

Option 3, a skill catalog. The data file `assets/data/generator/skills.json` holds one entry per skill code. The loader `src/data/loadSkillCatalog.ts` validates the file with `SkillCatalogSchema`, and the schema rejects unknown keys. A block inherits every value of its skill's entry that it does not override.

```ts
type SkillCatalog = { [skillCode: string]: SkillCatalogEntry };

type SkillCatalogEntry = SkillTreeEntry | TimingEntry;

type TimingFields = {
  // Skill properties: a template cannot set them.
  intensity?: string;
  intensityWithoutWeights?: string;
  startRepetitions?: number;
  startDuration?: number;
  // Block defaults: a block overrides them with fields of the same name.
  superset?: "none" | "muscles" | "drawOrder" | "drawOrderWithLeftovers";
  sets?: number;
  rest?: {
    withinSuperset: number;
    betweenSets: number;
    afterExercise: number;
    afterBlock?: number;
  };
};

type SkillTreeEntry = TimingFields & {
  // Skill properties: a template cannot set them.
  skillTree: { withWeights: string[]; withoutWeights: string[] };
  focusArea?: FocusArea;
  progression?: boolean;
  painRegions?: string[];
  // Block defaults: a block overrides them with fields of the same name.
  countBy?: "exercises" | "entries" | "pairs";
  fallbackToWholeTree?: boolean;
};

type TimingEntry = TimingFields;
```

`FocusArea` comes from `src/schemas/sync.schema.ts`. `rest` sets all three values, so a partial rest fails the load. `rest.afterBlock` is optional: it sets the closing rest of the skill's block in templates and plan workouts. Only `WUSPEZIAL` sets it, to 30 s.

A skill catalog entry either names a skill tree or is timing-only:

- **With a skill tree.** The 14 skills of the bundled trainings. A picks block accepts only these skills; a picks block on any other skill fails with `NO_EXERCISES/SKILL_TREE`.
- **Timing-only.** The 20 training day skills without a bundled training, for example `SWR1`, `SK`, `MAX`, and the cardio zones. Their skill trees stay with `getSkillTree`, which filters them per training place in ways no literal tree list expresses. A timing-only entry sets none of `skillTree`, `focusArea`, `progression`, `painRegions`, `countBy`, and `fallbackToWholeTree`.

An entry defines `sets` and `rest` together or neither. The cardio and max strength entries leave both out, because their set list builders bring their own sets and rests.

### Skill properties

A template cannot set these fields.

| Field | Content |
|---|---|
| `skillTree` | The tree names the skill draws from at a training place with weights (`withWeights`) and without (`withoutWeights`). The names are literal: `STABILITY` without weights reads `GKS`. A name without a tree reads as an empty tree. |
| `intensity`, `intensityWithoutWeights` | Intensity configuration. An exercise tagged as bodyweight uses `intensityWithoutWeights`. Without either, the skill reads `DEFAULTKG`. Hypertrophy (`SWR*`) and plyometrics keep a code rule that picks the configuration by the exercise. |
| `startRepetitions`, `startDuration` | Repetitions and seconds an exercise starts with when it advances by repetitions or by duration. Unset means 8 repetitions and 30 s. The cardio zones set 3 repetitions and their zone's duration. |
| `focusArea` | The area the stats credit the training time to |
| `progression` | `false`: exercises keep their values and ask for no feedback. Unset means on. |
| `painRegions` | Prevention skills: the pain regions the skill protects |

The pain regions of a `WUSPEZIAL` block come from the prevention skills of its template. The `WUSPEZIAL` entry has no `painRegions`.

### Block defaults

A block field of the same name overrides these defaults. The [AIWL ADR](./athletic-intelligence-workout-language.md#block-fields) defines each field.

| Field | Source of the default |
|---|---|
| `countBy`, `fallbackToWholeTree` | The bundled templates. Plan workouts do not draw by picks. |
| `superset`, `sets` | The values plan workouts use today |
| `rest` | The rests plan workouts use today. `afterBlock` of `WUSPEZIAL`: the 30 s rest before the prevention block of the bundled prevention trainings |

### Left out of the catalog

- **Title and description.** Skill names stay in the i18n keys `training.skill.<code>` (`src/i18n/locales/en.json` and `de.json`), as before. The [glossary](../specs/glossary.md) lists no title or description either.
- **Required equipment.** The per exercise equipment filter decides alone. A template does not name the equipment a block needs. A block at a training place without the equipment draws the branches the equipment allows, and fails only when no exercise is left. The bundled BR training at HOME shows this. The [AIWL ADR](./athletic-intelligence-workout-language.md#conformance) records the accepted difference.
- **`regionFilter`.** Not shipped. Bundled entries leave it unset until the generator supports `bodyParts`.

### Examples

Entries copied from `assets/data/generator/skills.json`:

```json
{
  "GKS": {
    "skillTree": { "withWeights": ["GKS"], "withoutWeights": ["GKSKG"] },
    "intensity": "GKS",
    "intensityWithoutWeights": "GKSKG",
    "focusArea": "STABILITY",
    "progression": true,
    "countBy": "entries",
    "fallbackToWholeTree": true,
    "superset": "none",
    "sets": 2,
    "rest": { "withinSuperset": 45, "betweenSets": 90, "afterExercise": 60 }
  },
  "STABILITY": {
    "skillTree": { "withWeights": ["BAS"], "withoutWeights": ["GKS"] },
    "focusArea": "STABILITY",
    "progression": true,
    "countBy": "exercises",
    "fallbackToWholeTree": false,
    "superset": "muscles",
    "sets": 2,
    "rest": { "withinSuperset": 30, "betweenSets": 60, "afterExercise": 60 }
  },
  "PREVSHOULDER": {
    "skillTree": {
      "withWeights": ["PREV", "PREVKG"],
      "withoutWeights": ["PREV", "PREVKG"]
    },
    "intensity": "PREV",
    "focusArea": "PREVENTION",
    "progression": true,
    "painRegions": ["SHOULDER"],
    "countBy": "pairs",
    "fallbackToWholeTree": false,
    "superset": "muscles",
    "sets": 2,
    "rest": { "withinSuperset": 30, "betweenSets": 60, "afterExercise": 60 }
  },
  "WUSPEZIAL": {
    "skillTree": { "withWeights": ["WUSPEZIAL"], "withoutWeights": ["WUSPEZIAL"] },
    "focusArea": "WARMUP",
    "countBy": "exercises",
    "fallbackToWholeTree": false,
    "superset": "muscles",
    "sets": 1,
    "rest": {
      "withinSuperset": 10,
      "betweenSets": 10,
      "afterExercise": 10,
      "afterBlock": 30
    }
  }
}
```

- The bundled GKS template overrides `afterExercise` to 45 s and draws its bodyweight picks by region tags.
- `STABILITY` draws leg axis stability with weights and full body stability without. Its tree names are literal, so the bodyweight variant reads `GKS`.
- `PREVSHOULDER` pairs by muscles like plan workouts. The bundled shoulder prevention training overrides `superset` to `drawOrderWithLeftovers` in its template block.
- The catalog has no `values` field. The block field `values` switches the source of repetitions and durations between the skill's intensity range and the exercise's own values. The bundled GKS block sets it to `exercise`. The `GKS` and `GKSKG` intensities set `overridesExerciseRepsAndDuration` to `false`, so plan workouts of `GKS` use the exercise values too. The `PREV` intensity, which all six prevention skills use, sets `overridesExerciseRepsAndDuration` to `false`, so prevention blocks use the exercise values in templates and plan workouts without a mode.
- `WUSPEZIAL` is the special warm-up of a prevention training. It has no intensity and no `progression`, so it keeps the plan workout behavior: progression on, and focus area `WARMUP`. Its `afterBlock` closes the block with 30 s in templates and plan workouts, while its own exercises rest 10 s. The generator narrows its tree by the pain regions of the prevention skills in the template.

### Set list builder

The skill code also selects the builder that turns the chosen exercises into a set list:

| Skill code | Set list |
|---|---|
| `CARDIO_1_SHORT`, `CARDIO_1_LAKTAT` to `CARDIO_5` | intervals or a steady run that fill the block's `minutes`, per [Cardio Training System](../specs/session/cardio-training-system.md) |
| `MAX`, `MAX_STRENGTH` | warm up ladder, working sets, support exercises, per [Max Strength Training](../specs/progression/max-strength-progression.md) |
| every other code | sets and rests per [Session Set Structure](../specs/session/session-set-structure.md). Weighted `SWR*` and `SK*` skills add a warm up set. |

## Pros and cons

- Pro: a skill value changes in one place for the bundled trainings. Plan days and trainer workouts reach it once plan workouts read the catalog.
- Pro: templates stay short. The bundled GKS training overrides one rest.
- Pro: a trainer workout cannot carry a wrong skill tree or intensity.
- Con: a reader of a template needs the catalog to know the sets, rests, and supersets of a block.
- Con: the block defaults copy values that `TrainingGenerator` holds today.
- Con: code that needs a skill tree calls `hasSkillTree` first.

## More information

ADRs: [Athletic Intelligence Workout Language](./athletic-intelligence-workout-language.md), [Exercise configs](./exercise-configs.md), which orders the sources of an exercise's values. Spec: [Plan Workout Generation](../specs/session/plan-workout-generation.md).
