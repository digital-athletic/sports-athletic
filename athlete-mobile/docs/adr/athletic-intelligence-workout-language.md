# ADR: Athletic Intelligence Workout Language

## Context

The app generates three kinds of workout:

1. a bundled focus training or prevention training, for example full-body stability,
2. a training day of the training plan, for example warm-up, hypertrophy, and full-body stability,
3. a workout a trainer composes from skills, with minutes per skill, and body regions.

Today the first two use separate formats: `focusTrainings.json` holds the bundled trainings, and plan creation stores each training day as branches and minutes per skill. The trainer workout has no format yet. The generator reads each format on its own path, so a rule added for one kind of workout misses the others.

This ADR uses the terms and skill codes of the [Glossary](../specs/glossary.md).

## Decision drivers

- One format describes all three kinds of workout, so the generator reads one input.
- A template describes the workout and nothing else:
  - **No strategy.** Season phases, weekdays, and the minute split per skill belong to plan creation.
  - **No athlete rules.** Pains, muscle soreness, equipment, age group, gender, and fitness level belong to the generator.
  - **No skill properties.** Skill tree, intensity, focus area, and progression belong to the [skill catalog](#skill-catalog). A block names its skill and inherits them.
- The new format reproduces the set lists the app generates today.

## Options

1. Keep both stored formats and add a third one for trainer workouts.
2. Extend the training day format with the picks and rests of the bundled trainings.
3. A new JSON format whose blocks draw by picks, by minutes, or from a fixed branch list.

## Outcome

Option 3. The **Athletic Intelligence Workout Language** (AIWL) is the JSON format for one workout. A **template** is one workout written in AIWL and lists the **blocks** of the workout in order. Each block names a skill and where its branches come from. The generator turns a template into a set list for one athlete.

Out of scope: importing templates at runtime, switching training days to AIWL, the trainer editor, and a published JSON Schema file.

## Schema

An AIWL file maps template keys to templates. `?` marks an optional field, `[T, ...T[]]` a list with at least one entry.

```ts
type AiwlFile = { [templateKey: string]: Template };

type Template = {
  aiwl: 1;
  name: LocalizedText;
  description?: LocalizedText;
  bodyRegions?: ("UPPER_BODY" | "LOWER_BODY" | "CORE" | "FULL_BODY")[];
  muscles?: Muscle[];
  order?: "asDrawn" | "muscleGroups";
  blocks: [Block, ...Block[]];
};

type Block = PicksBlock | MinutesBlock | BranchesBlock;

type PicksBlock = BlockBase & {
  picks: Picks | { withWeights: Picks; withoutWeights: Picks };
};

type Picks = [Pick, ...Pick[]];
type MinutesBlock = BlockBase & { minutes: number };
type BranchesBlock = BlockBase & { branches: [BranchId, ...BranchId[]]; minutes?: number };

type BlockBase = {
  skill: SkillCode;
  countBy?: "exercises" | "sides" | "pairs";
  fallbackToWholeTree?: boolean;
  superset?: "none" | "muscles" | "drawOrder" | "drawOrderWithLeftovers";
  sets?: number;
  setDuration?: number;
  rest?: { withinSuperset?: number; betweenSets?: number; afterExercise?: number };
};

type Pick = { tags: Tag[]; count: number };

type LocalizedText = { de: string; en: string };
```

`SkillCode`, `Tag`, `Muscle`, and `BranchId` are strings from the app data. `minutes` counts minutes. `setDuration` and `rest` count seconds.

Every object is strict: the app rejects unknown keys. The app tells the three block types apart by their keys:

| Block type | `picks` | `minutes` | `branches` |
|---|---|---|---|
| `PicksBlock` | required | not allowed | not allowed |
| `MinutesBlock` | not allowed | required | not allowed |
| `BranchesBlock` | not allowed | optional | required |

### Template fields

| Field | Required | Default | Meaning | Why the schema has it |
|---|---|---|---|---|
| `aiwl` | yes | | Schema version. The app rejects a version it does not know. A new field or a new enum value raises the version. | An older app reads the version and rejects a newer template with a version error. |
| `name` | yes | | Name of the workout in German and English. | The app shows a name for every workout: bundled trainings, training days, and trainer workouts. |
| `description` | no | none | One or two sentences on what the workout does. | Template authors explain the workout in it, and trainer templates show it later. No bundled training sets it. |
| `bodyRegions` | no | all | Body regions the workout trains. See [generation](#generation), step 3. | The trainer picks body regions for a workout. No other field restricts regions. |
| `muscles` | no | all | Muscles the workout targets, for example glutes and hamstrings. See step 3. | A trainer can build a workout for single muscles. `bodyRegions` knows four regions and no muscles. No bundled training sets it. |
| `order` | no | `asDrawn` | `asDrawn` keeps the order in which the blocks drew their exercises. `muscleGroups` sorts every block: big muscle groups first, rotating body regions, max strength lower body first. | Training days sort by muscle groups, and focus trainings keep the drawn order. One skill appears in both, so the catalog cannot store one value. A training day sorts all its blocks, so the template sets the order once. |
| `blocks` | yes | | The workout parts, in order. | A workout consists of its blocks. |

The workout has no total time field. Its length is the sum of the block minutes.

### Block fields

"catalog" in the Default column means the value of the block's skill in the [skill catalog](#skill-catalog). A block sets the field only to override it.

| Field | Required | Default | Meaning | Why the schema has it |
|---|---|---|---|---|
| `skill` | yes | | Skill code of the skill catalog. Selects skill tree, intensity, set list builder, and defaults. | A block trains one skill, and the skill code names it. The catalog supplies the values the block omits. |
| `picks` | in a `PicksBlock` | | Branches to draw from the skill tree, by tags and count. A list applies at every training place. `{ withWeights, withoutWeights }` gives a training place with weights and one without its own list, with the same keys as the catalog's `skillTree`. | All 13 bundled trainings draw by tags and counts. Full-body stability uses the two-list form: 4 sides with weights, 3 upper body + 2 full body sides without. |
| `minutes` | in a `MinutesBlock`; optional in a `BranchesBlock` | | Cardio `MinutesBlock`: the length the cardio builder fills. Any other `MinutesBlock`: the [minutes table](#minutes-table) key the chooser reads. `BranchesBlock`: the planned length, which the preview shows. | Plan creation stores minutes per skill, a trainer sets minutes per skill, and the cardio builder fills a length. |
| `branches` | in a `BranchesBlock` | | The block trains these branches, in this order. | Plan creation stores the branches of a training day. A fixed list replays them. |
| `countBy` | no | catalog | What one unit of a pick's `count` is. `exercises`: one exercise. `sides`: one side, so a one-sided exercise counts twice (left and right) and a two-sided exercise once. `pairs`: one superset pair. | The catalog default matches every bundled training. A template overrides it to count differently for the same skill. |
| `fallbackToWholeTree` | no | catalog | `true`: when the picks find too few matching branches, the block draws the rest from its whole skill tree. `false`: the block stays short. | Same as `countBy`. |
| `sets` | no | catalog | Sets per exercise. | Same as `countBy`. No bundled training overrides it. |
| `setDuration` | no | intensity | Every set of the block lasts this many seconds. The set has no repetitions, weight, or height. | Warm-up, mobility, foam roller, and cool-down trainings work 60 s per set. Training days take repetitions or durations from the intensity. One skill appears in both, so the catalog cannot store one value. |
| `rest.withinSuperset` | no | catalog | Rest after each exercise of a superset pair, before its partner. | A block without it rests like a training day block of its skill. |
| `rest.betweenSets` | no | catalog | Rest between the sets of a single exercise. | Same as `rest.withinSuperset`. |
| `rest.afterExercise` | no | catalog | Rest after the last set of an exercise or pair. The generator uses `betweenSets` instead when the next exercise trains the same region and primary muscle. | Focus trainings rest less than training days: warm-up 10 s instead of 30 s, leg axis stability 30 s instead of 60 s, full-body stability 45 s instead of 60 s. |
| `superset` | no | catalog | `none`: no pairs. `muscles`: pairs opposing muscles. `drawOrder`: pairs neighbours in the order the block drew them; an exercise without a free neighbour trains alone. `drawOrderWithLeftovers`: pairs like `drawOrder`, then pairs the exercises that train alone with each other. A one-sided exercise always pairs with its other side. | Training days pair by muscles. Warm-up, mobility, foam roller, and cool-down trainings use `none`, prevention trainings `drawOrderWithLeftovers`, and leg axis stability `drawOrder`. |

### Picks and tags

A pick lists `tags` and draws `count` units of matching branches. The app sorts the tags into tag groups. A tag group is the prefix the tag starts with, from the app's `TagGroups` constants, for example `SKILL` or `PREVENTION`. When two prefixes fit, the longer one wins, so `EQ_TYPE_WEIGHTS` belongs to `EQ_TYPE`.

A branch matches a pick when, for every tag group the pick names, the branch carries at least one of the listed tags of that group. A branch without a region tag matches every `REGION` tag. A pick with no tags matches every branch.

In the shoulder prevention example below, the warm-up pick names `SKILL_WU`, `SKILL_WARM_UP`, `SKILL_WARM_UP_SPECIAL`, and `PREVENTION_SHOULDER`. A branch matches when it carries one of the three `SKILL` tags and the `PREVENTION_SHOULDER` tag.

### Rules

1. A block whose skill starts with `CARDIO` is a `MinutesBlock`. `minutes` sets its length.
2. Any other `MinutesBlock` names a minutes key of its [minutes table](#minutes-table) entry, `default` variant.
3. A `BranchesBlock` lists branches of its skill tree only.
4. The app rejects a template that breaks a rule and names the path of the error, for example `MOBGKS30.blocks[1].minutes: 25 is no key of GKS`.

## Skill catalog

The skill catalog is a separate data file with one entry per skill code. Its fields do not appear in a template. A block names its skill and inherits the entry:

1. **Skill properties**, such as skill tree, intensity, focus area, progression, and `regionFilter`. A template cannot set them.
2. **Block defaults**: `countBy`, `fallbackToWholeTree`, `superset`, `sets`, and `rest`. A block field of the same name overrides them.

The skill code also selects the set list builder: cardio, max strength, or the standard sets and rests.

[ADR: Skill catalog](./skill-catalog.md) defines the entry type, every field, example entries, and the builders.

## Minutes table

The minutes table in `assets/data/generator/regions.json` turns a skill and minutes into picks. Plan creation uses it today. A `MinutesBlock` uses the same table and the same chooser, `PlanGenerator.getBranchesForWorkout`, so a trainer's minutes select branches like a plan day: direction balanced, with named exercises, and with tags that point into other trees.

1. The skill code selects the entry. `CARDIO_*` reads `CARDIO`, `MAX_STRENGTH` reads `MAX`, `SWR2` reads `SWR1`.
2. Children read the `child` variant, pro athletes `professional`, everyone else `default`.
3. The chooser takes the key nearest to `minutes` in that variant.

Rule 2 makes a template name an existing key of the `default` variant, so the chooser finds that key for adults. The nearest key matters for the `child` and `professional` variants, whose keys can differ, and for plan creation, which passes any length.

Minutes keys of the `default` variant:

| Entry | Minutes |
|---|---|
| `MOB`, `WU`, `CD`, `BR`, `BAS` | 5, 10 |
| `PREVSHOULDER`, `PREVKNEE`, `PREVWRIST`, `PREVANKLE`, `PREVSPINE` | 5, 10, 15 |
| `GKS` | 5 to 40, in steps of 5 |
| `SWR1` | 20 to 55, in steps of 5 |
| `MAX` | 10, 20, 30, 45 |
| `SA`, `SAKG`, `SK`, `SKKG`, `SWR1KG`, `SWR2KG`, `WUSKSA`, `WUSPEZIAL` | the keys in `regions.json` |

`STABILITY` has no entry and cannot be a `MinutesBlock`.

## Generation

The generator runs these steps per block, in block order. One set of used branches spans the whole workout, so no branch repeats across blocks.

1. **Pool.** The pool holds the branches the block can draw from: its skill's `skillTree` for a training place with or without weights. A special warm-up block (`WUSPEZIAL`) narrows its skill tree to the pain regions of the workout's prevention block.
2. **Athlete rules.** The generator applies its rules for pains, muscle soreness, equipment, age group, fitness level, and max strength, per [Plan Workout Generation](../specs/session/plan-workout-generation.md). A template sets none of them. A training place without the needed equipment leaves an empty pool, and the workout aborts.
3. **Body regions and muscles.** These filters apply only to `PicksBlock` and `MinutesBlock`, and only for a skill with `regionFilter`:
   - `bodyRegions` filters the pool: it keeps branches tagged with a selected region and branches without a region tag. A `fallbackToWholeTree` draw therefore stays inside the selected regions too. `FULL_BODY` counts as its own region. All four regions, or none, keep every branch.
   - The generator drops unselected region tags from the picks and merges picks that become equal.
   - `muscles` keeps branches that train a selected muscle, when at least one such branch is left.
   - A skill tree without the selected region leaves the request unmet. Full-body stability (`GKS`) has no lower body or core branch, so the block fills from its whole pool.
4. **Choose.**
   - A `PicksBlock` draws each pick's `count` from the matching branches, as `countBy` and `fallbackToWholeTree` say.
   - A `MinutesBlock` runs the [minutes table](#minutes-table) chooser.
   - A `BranchesBlock` keeps its list.
5. **Order.** With `order: "muscleGroups"`, the block sorts its exercises and pairs as training days do. The block also avoids opening with the exercise that ended the block before.
6. **Branch level.** Every branch resolves to the exercise of the athlete's branch level.
7. **Set list.** The skill code selects the set list builder. A cardio block passes `minutes`.

The preview estimates a block's length from the generated set list: all work and rest entries, with a repetition counted as 5 seconds. A single exercise takes sets × set duration + (sets − 1) × `betweenSets` + one closing rest. The last exercise of the workout has no closing rest.

## Examples

### Example 1: focus training and prevention training

The bundled full-body stability training draws 4 sides with weights, and 3 upper body + 2 full body sides without weights:

```json
"GKS": {
  "aiwl": 1,
  "name": { "en": "Full body stability", "de": "Ganzkörperstabilität" },
  "blocks": [
    {
      "skill": "GKS",
      "picks": {
        "withWeights": [{ "tags": [], "count": 4 }],
        "withoutWeights": [
          { "tags": ["REGION_UPPER_BODY"], "count": 3 },
          { "tags": ["REGION_FULL_BODY"], "count": 2 }
        ]
      },
      "rest": { "afterExercise": 45 }
    }
  ]
}
```

The skill catalog entry `GKS` supplies skill tree, intensity, `countBy`, `fallbackToWholeTree`, `sets`, `superset`, and the rests 45 s and 90 s. The block sets only `afterExercise: 45`, where training days rest 60 s.

The bundled shoulder prevention training:

```json
"PREVSHOULDER": {
  "aiwl": 1,
  "name": { "en": "Shoulder prevention", "de": "Schulterprävention" },
  "blocks": [
    {
      "skill": "WUSPEZIAL",
      "picks": [
        { "tags": ["SKILL_WU", "SKILL_WARM_UP", "SKILL_WARM_UP_SPECIAL", "PREVENTION_SHOULDER"], "count": 3 }
      ]
    },
    {
      "skill": "PREVSHOULDER",
      "picks": [{ "tags": ["SKILL_PREVENTION", "PREVENTION_SHOULDER"], "count": 3 }],
      "superset": "drawOrderWithLeftovers"
    }
  ]
}
```

The special warm-up block draws 3 exercises from `WUSPEZIAL`, narrowed to the shoulder. The prevention block draws 3 pairs from the prevention skill trees with and without weights (`PREV`, `PREVKG`) and trains 2 sets. It pairs in draw order, where training days pair by muscles, so it sets `superset`. The other prevention trainings do the same, and leg axis stability (`BAS`) sets `"superset": "drawOrder"`.

### Example 2: training day

Plan creation stores a training day as branches and minutes per skill. Each skill becomes a `BranchesBlock`, in the plan's section order. The skill defaults supply sets, rests, and supersets.

```json
"PLAN_SWR1_45": {
  "aiwl": 1,
  "name": { "de": "Muskelaufbau", "en": "Hypertrophy" },
  "order": "muscleGroups",
  "blocks": [
    { "skill": "WU", "minutes": 10, "branches": ["11", "14", "17", "20", "23"] },
    { "skill": "SWR1", "minutes": 25, "branches": ["201", "205", "212", "219", "230", "244"] },
    { "skill": "GKS", "minutes": 10, "branches": ["301", "307", "315"] }
  ]
}
```

The branch IDs show the format. Plan creation writes the real ones.

| Block | Skill defaults | Athlete rules in the session |
|---|---|---|
| Warm-up | 1 set; rests 10, 10, 30 s | the branch level selects each exercise |
| Hypertrophy | 2 sets plus a warm-up set with weights; rests 30, 90, 60 s; muscle supersets | a squat blocked by knee soreness takes a lower body replacement from the hypertrophy skill tree |
| Full-body stability | 2 sets; rests 45, 90, 60 s; no supersets | the bodyweight skill tree `GKSKG` at a training place without weights |

A max strength day names `"skill": "MAX"` in the middle block.

### Example 3: a trainer composes a workout

The trainer chooses:

1. Skills with minutes: mobility 10 minutes, full-body stability 20 minutes.
2. Body region: upper body.

The editor writes one `MinutesBlock` per skill:

```json
"MOBGKS30": {
  "aiwl": 1,
  "name": { "de": "Mobilität und Stabilität", "en": "Mobility and stability" },
  "bodyRegions": ["UPPER_BODY"],
  "order": "muscleGroups",
  "blocks": [
    { "skill": "MOB", "minutes": 10, "setDuration": 60 },
    { "skill": "GKS", "minutes": 20 }
  ]
}
```

Generation for an adult athlete at a training place with weights:

| Step | Mobility block | Full-body stability block |
|---|---|---|
| Pool | `MOB` skill tree | `GKS` skill tree |
| Minutes table | `MOB.default["10"]`: upper body 4, lower body 4, full body 2 | `GKS.default["20"]`: full body 4, upper body 2 |
| Body regions | one pick of 10 sides from upper body branches and branches without region tag | one pick of 6 sides from the same kind of branches |
| Set list | 1 set; 60 s per set; 10 s rests | 2 sets; rests 45, 90, 60 s; no supersets |

The workout runs 30 minutes as planned. The mobility estimate is 10 × 60 s per set + 10 × 10 s rest = 700 s, about 12 minutes. As the last block, the mobility block would lose its final rest and take 690 s. The preview shows the estimate next to the planned 10 minutes.

## Conformance

`src/features/training/generators/aiwlEquivalence.spec.ts` checks that AIWL reproduces the workouts the app generates today. Under seeds 1, 7, and 42 it compares the set lists of:

- the 13 bundled trainings, for athletes with and without weights, a child, and an athlete with pains,
- every training day of 21 plan profiles across season phases, fitness levels, age groups, and training places, with and without muscle soreness,
- a trainer `MinutesBlock` against plan creation's choice for the same skill and minutes.

The set lists match in exercises, order, sets, set durations, and rests.

## Related standards

No open standard describes a workout template that a generator resolves per athlete. The existing formats describe fixed steps:

- **Schema.org `ExercisePlan`** (subtype of `PhysicalActivity`): an open vocabulary for exercise prescriptions.
- **Garmin FIT** (Flexible and Interoperable Data Transfer) workout files: binary, the de facto device format, with `workout_step` messages and repeat steps.
- **Apple WorkoutKit**: structured workouts for Apple Watch, mostly endurance.
- **HL7 FHIR** (Fast Healthcare Interoperability Resources) Physical Activity: clinical exercise prescriptions.

AIWL follows none of them. The set list the generator produces fits fixed steps better than a template does. [ADR: Set list in schema.org](./set-list-schema-org.md) plans an export of the set list.

## Pros and cons

- Pro: one format and one generator path for bundled trainings, training days, and trainer workouts.
- Pro: the equivalence test shows that AIWL reproduces today's set lists.
- Pro: templates stay short, since the skill catalog supplies the skill values.
- Con: the app still reads `focusTrainings.json` and the stored training days until a follow up switches them to AIWL.
- Con: `minutes` means a length or a minutes table key, depending on the block type.
- Con: a template cannot set the rest after the last set of an exercise on its own. The generator picks `afterExercise` or `betweenSets` by the next exercise.

## Open questions

- **`STABILITY` in trainer workouts.** `STABILITY` has no minutes table entry, so a trainer cannot add it by minutes. A follow up decides whether it gets an entry.
- **Foam roller minutes without exercises.** Plan creation can book minutes for a skill without storing exercises for it, for example 5 minutes of foam roller on a cardio day. The athlete sees neither the exercises nor the minutes, since the generator builds blocks from stored exercises only (`TrainingGenerator.ts:887`). AIWL expresses the day with `{ "skill": "BR", "minutes": 5 }`. A follow up fixes plan creation.

## More information

ADRs: [Skill catalog](./skill-catalog.md), [Set list in schema.org](./set-list-schema-org.md). Specs: [Plan Workout Generation](../specs/session/plan-workout-generation.md), [Glossary](../specs/glossary.md).
