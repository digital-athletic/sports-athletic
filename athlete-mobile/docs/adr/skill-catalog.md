# ADR: Skill catalog

## Context

An [AIWL](./athletic-intelligence-workout-language.md) block names a skill, for example `GKS` or `PREVSHOULDER`. The generator needs more about that skill than its code: the skill tree to draw from, the intensity, the focus area for the stats, and the sets, rests, and supersets of its blocks.

Today the app keeps these values in two places:

- `focusTrainings.json` stores skill tree, intensity, focus area, progression, and pain regions on every bundled training.
- Plan workouts read sets, rests, and supersets from `TrainingGenerator` methods such as `getSetCountBySkill` and `getAfterSetPauseBySkill`.

One skill appears in both places, for example full body stability in a plan day and in the bundled GKS training. Without one source per skill, a template has to repeat the skill's values, and the two places drift apart.

## Decision drivers

- A template describes the workout and nothing else, so a block names its skill and stays short.
- A skill property such as the intensity changes in one place and reaches plan days, bundled trainings, and trainer workouts alike.
- A template can still differ from its skill where a workout needs it, for example the shorter rests of focus trainings.
- A trainer composing a workout cannot set a wrong skill tree or intensity.

## Options

1. Every template carries all skill values, as `focusTrainings.json` does today.
2. The generator code decides everything, as plan workouts do today.
3. A skill catalog: one data entry per skill code holds the skill properties and block defaults, and a block overrides only the defaults.

## Outcome

Option 3, a skill catalog. A new data file, `assets/data/generator/skills.json`, holds one entry per skill code. A block inherits every value of its skill's entry.

```ts
type SkillCatalog = { [skillCode: string]: SkillCatalogEntry };

type SkillCatalogEntry = {
  // Skill properties: a template cannot set them.
  title: LocalizedText;
  description: LocalizedText;
  skillTree: { withWeights: string[]; withoutWeights: string[] };
  intensity?: string;
  intensityWithoutWeights?: string;
  focusArea?: string;
  progression?: boolean;
  painRegions?: string[];
  regionFilter?: boolean;
  // Block defaults: a block overrides them with fields of the same name.
  countBy?: "exercises" | "entries" | "pairs";
  fallbackToWholeTree?: boolean;
  superset?: "none" | "muscles" | "drawOrder" | "drawOrderWithLeftovers";
  sets?: number;
  rest?: { withinSuperset: number; betweenSets: number; afterExercise: number };
};
```

### Skill properties

A template cannot set these fields.

| Field | Content |
|---|---|
| `title`, `description` | German and English, one sentence each |
| `skillTree` | The trees the skill draws from at a training place with weights and at one without |
| `intensity`, `intensityWithoutWeights` | Intensity configuration. An exercise tagged as bodyweight uses `intensityWithoutWeights`. |
| `focusArea` | The area the stats credit the training time to |
| `progression` | `false`: exercises keep their values and ask for no feedback |
| `painRegions` | Prevention skills: the pain regions the skill protects |
| `regionFilter` | Whether the template's `bodyRegions` applies to the skill. Leg axis stability: `false`. |

### Block defaults

A block field of the same name overrides these defaults. The [AIWL ADR](./athletic-intelligence-workout-language.md#block-fields) defines each field.

| Field | Source of the default |
|---|---|
| `countBy`, `fallbackToWholeTree` | The bundled templates. Plan workouts do not draw by picks. |
| `superset`, `sets` | The values plan workouts use today |
| `rest` | The rests plan workouts use today |

### Examples

Entries shortened to the fields that matter here:

```json
{
  "GKS": {
    "skillTree": { "withWeights": ["GKS"], "withoutWeights": ["GKSKG"] },
    "intensity": "GKS", "intensityWithoutWeights": "GKSKG",
    "focusArea": "STABILITY", "progression": true, "regionFilter": true,
    "countBy": "entries", "fallbackToWholeTree": true, "superset": "none", "sets": 2,
    "rest": { "withinSuperset": 45, "betweenSets": 90, "afterExercise": 60 }
  },
  "STABILITY": {
    "skillTree": { "withWeights": ["BAS"], "withoutWeights": ["GKS"] }
  },
  "PREVSHOULDER": {
    "skillTree": { "withWeights": ["PREV", "PREVKG"], "withoutWeights": ["PREV", "PREVKG"] },
    "intensity": "PREV", "focusArea": "PREVENTION", "painRegions": ["SHOULDER"],
    "countBy": "pairs", "superset": "muscles", "sets": 2
  },
  "PREV": {
    "skillTree": { "withWeights": ["PREV"], "withoutWeights": ["PREV"] }
  }
}
```

`STABILITY` draws leg axis stability with weights and full body stability without. `PREVSHOULDER` pairs by muscles like plan workouts, so the bundled shoulder prevention training overrides `superset`.

### Set list builder

The skill code also selects the builder that turns the chosen exercises into a set list:

| Skill code | Set list |
|---|---|
| `CARDIO_1_SHORT`, `CARDIO_1_LAKTAT` to `CARDIO_5` | intervals or a steady run that fill the block's `minutes`, per [Cardio Training System](../specs/session/cardio-training-system.md) |
| `MAX`, `MAX_STRENGTH` | warm up ladder, working sets, support exercises, per [Max Strength Training](../specs/progression/max-strength-progression.md) |
| every other code | sets and rests per [Session Set Structure](../specs/session/session-set-structure.md). Weighted `SWR*` and `SK*` skills add a warm up set. |

## Pros and cons

- Pro: a skill value changes in one place for plan days, bundled trainings, and trainer workouts.
- Pro: templates stay short. The bundled GKS training overrides one rest.
- Pro: a trainer workout cannot carry a wrong skill tree or intensity.
- Con: a reader of a template needs the catalog to know the sets, rests, and supersets of a block.
- Con: the block defaults copy values that `TrainingGenerator` holds today, until plan workouts read the catalog too.
- Con: `skills.json` does not exist yet. The equivalence test builds the catalog from the bundled templates and the generator code (`test/factories/aiwlAdapter.ts`).

## More information

ADRs: [Athletic Intelligence Workout Language](./athletic-intelligence-workout-language.md), [Exercise configs](./exercise-configs.md), which orders the sources of an exercise's values. Spec: [Plan Workout Generation](../specs/session/plan-workout-generation.md).
