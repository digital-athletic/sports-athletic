# ADR: Athletic Intelligence Workout Language

## Context

The app generates three kinds of workout:

1. a bundled focus training or prevention training, for example full-body stability,
2. a training day of the training plan, for example warm-up, hypertrophy, and full-body stability,
3. a workout a trainer composes from skills, with minutes per skill, and body regions.

The bundled trainings are AIWL templates in `assets/data/templates/`. Training days still use their own stored format: plan creation stores each training day as branch entries and minutes per skill. The trainer workout has no format yet. Before AIWL, the generator read each format on its own path, so a rule added for one kind of workout missed the others.

This ADR uses the terms and skill codes of the [Glossary](../specs/glossary.md).

## Decision drivers

- One format describes all three kinds of workout, so the generator reads one input.
- A template describes the workout and nothing else:
  - **No strategy.** Season phases, weekdays, and the minute split per skill belong to plan creation.
  - **No athlete rules.** Pains, muscle soreness, equipment, age group, gender, and fitness level belong to the generator.
  - **No skill properties.** Skill tree, intensity, focus area, and progression belong to the [skill catalog](#skill-catalog). A block names its skill and inherits them.
- The new format reproduces the set lists the app generates today, with one accepted difference listed under [Conformance](#conformance).

## Options

1. Keep both stored formats and add a third one for trainer workouts.
2. Extend the training day format with the picks and rests of the bundled trainings.
3. A new JSON format whose blocks draw by picks, by duration, or from a fixed branch list.

## Outcome

Option 3. The **Athletic Intelligence Workout Language** (AIWL) is the JSON format for one workout. A **template** is one workout written in AIWL and lists the **blocks** of the workout in order. Each block names a skill and where its branches come from. The generator turns a template into a set list for one athlete.

Out of scope: importing templates at runtime, storing training days as AIWL, the trainer editor, and publishing the JSON Schema file that `$schema` points to.

## Current support

The generator runs these workout sources:

| Workout source | Generator | Template | Block kinds |
|---|---|---|---|
| Short workout (focus training, prevention training) | AIWL generator | Bundled template | `picks` and `branches`, alone or mixed |
| Training day, AIWL generator flag on | AIWL generator | The generator runs the stored training day as a [stored day workout](./workout-generator-architecture.md#stored-workouts), which is no AIWL document | `branches`, one block per stored skill |
| Training day, flag off (default) | Old training day path | none | none |
| Strength test (app) | Old path | none | none |
| Strength test source, inactive | AIWL generator | Bundled template `TEST.json`, outside the short workout templates | `picks` with the strength test warm-up rules, then `exercises` with `testSets` |
| Trainer workout | none | No editor exists | `duration` (planned) |

A template configures these training day skills:

| Training | Skill codes | Block kind |
|---|---|---|
| Speed warm-up | `WUSKSA` | `picks` |
| Plyometrics, low and medium intensity | `PLYO_MEDIUM` | `picks` |
| Plyometrics, high intensity | `PLYO_HIGH` | `picks` |
| Explosive power | `SK`, `SKKG` | `picks` |
| Hypertrophy | `SWR1`, `SWR1KG`, `SWR2`, `SWR2KG` | `picks` |
| Max strength | `MAX`, `MAX_STRENGTH` | `picks`, built by the max strength builder |
| Cardio, zones 1 short, 1 lactate and 2 to 5 | `CARDIO_1_SHORT`, `CARDIO_1_LAKTAT`, `CARDIO_2` to `CARDIO_5` | `duration` |

Power endurance (`SA`, `SAKG`, `SAS`) has no picks block yet. The [skill catalog](./skill-catalog.md) lists the trees each code reads.

[ADR: Workout generator architecture](./workout-generator-architecture.md#stored-workouts) describes how a training day reads its stored branches and lists the compatibility exceptions. The [strength test source](./workout-generator-architecture.md#strength-test-source) authors the protocol of the old strength test in `TEST.json`, and the router does not call it yet.

The schema accepts four parts a short workout rejects with `OTHER/BLOCK_KIND`:

1. the `duration` block of a skill other than a cardio zone, until a follow-up implements it
2. the `order` field of any block, until a follow-up implements it
3. the `bodyParts` field of a picks or duration block, until a follow-up implements it
4. the `exercises` block, which only the strength test source runs

A stored day workout holds none of them, so the check fires for short workouts only.

## Schema

One AIWL file holds one template. `?` marks an optional field, `[T, ...T[]]` a list with at least one entry.

```ts
type Template = {
  $schema?: string;
  aiwl: 1;
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  blocks: [Block, ...Block[]];
};

type Block =
  | (BlockBase & { kind: "picks"; picks: Picks | { withWeights: Picks; withoutWeights: Picks }; bodyParts?: BodyParts })
  | (BlockBase & { kind: "duration"; duration: number; bodyParts?: BodyParts })
  | (BlockBase & { kind: "branches"; branches: [BranchId, ...BranchId[]]; duration?: number })
  | (ExercisesBlockBase & { kind: "exercises"; exercises: [ExerciseId, ...ExerciseId[]]; testSets?: [TestSet, ...TestSet[]] });

// An exercises block lists each exercise once. The builder its skill catalog
// entry names accepts only the settings it reads; the strength test builder
// reads testSets only.
type ExercisesBlockBase = Pick<BlockBase, "skill" | "sets" | "setDuration" | "values" | "rest">;

// share: part of the test set load, above 0 and at most 1.
type TestSet = { share: number; repetitions: number | "amrap"; rest: number };

type Picks = [Pick, ...Pick[]];
type Pick = { tags: Tag[]; count: number };

type BodyParts = {
  regions?: ("upperBody" | "lowerBody" | "core" | "fullBody")[];
  muscles?: Muscle[];
};

type BlockBase = {
  skill: SkillCode;
  order?: "asDrawn" | "muscleGroups";
  countBy?: "exercises" | "entries" | "pairs";
  fallbackToWholeTree?: boolean;
  superset?: "none" | "muscles" | "drawOrder" | "drawOrderWithLeftovers";
  sets?: number;
  setDuration?: number;
  values?: "skill" | "exercise";
  rest?: {
    withinSuperset?: number;
    betweenSets?: number;
    afterExercise?: number;
    afterBlock?: number; // the catalog may set a default
  };
};

type LocalizedText = { en: string } & Record<string, string>;
```

`SkillCode`, `Tag`, `Muscle`, `BranchId`, and `ExerciseId` are IDs from the app data and keep the app data's casing, for example `GKS` or `REGION_UPPER_BODY`. Every value AIWL defines itself uses camelCase. Every time value counts seconds: `duration`, `setDuration`, and the three `rest` values.

Every object is strict: the app rejects unknown keys. `kind` names the block type, and each kind allows these keys:

| `kind` | `picks` | `duration` | `branches` | `exercises` |
|---|---|---|---|---|
| `picks` | required | not allowed | not allowed | not allowed |
| `duration` | not allowed | required | not allowed | not allowed |
| `branches` | not allowed | optional | required | not allowed |
| `exercises` | not allowed | not allowed | not allowed | required |

An exercises block also rejects `bodyParts`, `countBy`, `fallbackToWholeTree`, `order`, and `superset`: its list fixes selection and order, and each exercise trains alone.

### Template fields

| Field | Required | Default | Meaning | Why the schema has it |
|---|---|---|---|---|
| `$schema` | no | none | URL of the AIWL JSON Schema. | Editors validate the file while an author writes it. |
| `aiwl` | yes | | Format identifier and version. The app rejects a version it does not know. A change of meaning raises the version. An addition that leaves every existing template valid and unchanged in meaning keeps it, because the bundled templates ship with the app that reads them: the `exercises` block kind joined version 1. Only `StrengthTestTemplateSchema` accepts it; `TemplateSchema`, which short workouts and custom workouts read, stays without it. | An older app reads the version and rejects a newer template with a version error. |
| `id` | yes | | Unique ID of the template, for example `GKS` for the bundled full-body stability training. | The app loads a bundled training by its ID, and validation errors start their path with it. |
| `name` | yes | | Name of the workout, one text per language. `en` is required and serves as the fallback. | The app shows a name for every workout: bundled trainings, training days, and trainer workouts. The app ships German and English, so bundled templates carry `de` and `en`. |
| `description` | no | none | One or two sentences on what the workout does, one text per language like `name`. | Template authors explain the workout in it, and trainer templates show it later. No bundled training sets it. |
| `blocks` | yes | | The workout parts, in order. | A workout consists of its blocks. |

The workout has no total time field. Its length is the sum of the block durations.

### Block fields

"catalog" in the Default column means the value of the block's skill in the [skill catalog](#skill-catalog). A block sets the field only to override it.

| Field | Required | Default | Meaning | Why the schema has it |
|---|---|---|---|---|
| `kind` | yes | | Block type: `picks`, `duration`, `branches`, or `exercises`. Short workouts run `picks`, `branches` and cardio `duration` blocks, also mixed in one template, and reject `exercises` and every other `duration` block with `BLOCK_KIND`. The strength test source runs `picks` and `exercises`. | The app checks the block's keys against its type and reports a wrong key by name. |
| `skill` | yes | | Skill code of the skill catalog. Selects skill tree, intensity, set list builder, and defaults. | A block trains one skill, and the skill code names it. The catalog supplies the values the block omits. |
| `picks` | in a picks block | | Branches to draw from the skill tree, by tags and count. A list applies at every training place. `{ withWeights, withoutWeights }` gives a training place with weights and one without its own list, with the same keys as the catalog's `skillTree`. | All 13 bundled trainings draw by tags and counts. Full-body stability uses the two-list form: 4 entries with weights, 3 upper body + 2 full body entries without. |
| `duration` | in a duration block; optional in a branches block | | Cardio duration block: the length the cardio builder fills. Any other duration block: the length whose minutes the [minutes table](#minutes-table) chooser reads. Branches block: the planned length, which the preview shows. | Plan creation stores minutes per skill, a trainer sets minutes per skill, and the cardio builder fills a length. |
| `order` | no | `asDrawn` | Order of the block's exercises. `asDrawn` keeps the order in which the block drew them. `muscleGroups` sorts them per [Exercise order inside a skill](./exercise-order.md): alternating body regions, big muscle groups first inside a region, max strength lower body first. The blocks themselves always run in template order. The generator rejects `order` with `BLOCK_KIND` until a follow-up supports it. | Training days sort by muscle groups, and focus trainings keep the drawn order. One skill appears in both, so the catalog cannot store one value. |
| `bodyParts` | no, in a picks or duration block | all | The body parts the block trains, at two levels of detail. See [generation](#generation), step 3. The generator rejects `bodyParts` with `BLOCK_KIND` until a follow-up supports it. | A trainer restricts a block to parts of the body, so three blocks of one workout can train three different muscles. One field holds both levels, so one filter rule covers them. |
| `bodyParts.regions` | no | all | Body regions. `upperBody`, `lowerBody`, `core`, and `fullBody` stand for the region tags `REGION_UPPER_BODY`, `REGION_LOWER_BODY`, `REGION_CORE`, and `REGION_FULL_BODY`. | The trainer picks body regions. |
| `bodyParts.muscles` | no | all | Muscles, for example glutes and hamstrings. | A trainer can build a block for single muscles. No bundled training sets it. |
| `branches` | in a branches block | | The block trains these branches. With `order: "asDrawn"` they keep the listed order, with `muscleGroups` the block sorts them. | Plan creation stores the branches of a training day. A fixed list replays them. |
| `exercises` | in an exercises block | | The block trains these catalog exercises, each once, in the listed order, whatever the athlete's fitness level, branch levels, or earlier blocks. No exercise resolves through a branch, and none moves branch progression. | The strength test measures five fixed lifts. A branch could lead to another exercise as the athlete progresses, so a branch list cannot prescribe them. |
| `testSets` | for a strength test builder; not allowed in other blocks | | The sets of every exercise, in order. `share`: part of the test set load the set lifts. `repetitions`: a count, or `amrap` for the test set the athlete lifts as often as possible. `rest`: seconds after the set. | The strength test protocol ramps up in sets of fixed reps before the AMRAP test set. The template, not the builder, authors them. |
| `countBy` | no | catalog | What one unit of a pick's `count` is. `exercises`: one exercise. `entries`: one exercise entry. A two sided exercise is one entry, a one sided exercise two entries (its left and its right execution). `pairs`: one superset pair. | The catalog default matches every bundled training. A template overrides it to count differently for the same skill. |
| `fallbackToWholeTree` | no | catalog | `true`: when the picks find too few matching branches, the block draws the rest from its whole skill tree. `false`: the block stays short. | Same as `countBy`. |
| `sets` | no | catalog | Sets per exercise. | Same as `countBy`. No bundled training overrides it. |
| `setDuration` | no | intensity | Every set of the block lasts this many seconds. The set has no repetitions, weight, or height. | No bundled template sets it, because short workouts keep the authored repetitions and durations of each exercise. A custom workout can still fix the length of every set. |
| `values` | no | intensity | Where the repetitions and durations come from. `skill`: the skill's intensity range. `exercise`: the exercise's own authored start and target values for the athlete's gender and level. Without the field, the skill's intensity decides. Weights and heights stay unchanged. The same mode applies when a completed exercise resets its repetitions after a weight increase. | A block can switch the source for one workout without changing the skill's intensity. The full-body stability training sets `exercise`. Since the `GKS` and `GKSKG` intensities no longer override exercise values, plan workouts of that skill use the exercise values as well. The `PREV` intensity sets `overridesExerciseRepsAndDuration` to `false`, so prevention blocks need no mode: they use the exercise start values and targets in short workouts and plan workouts, including the reset after a weight step and the target progression without weight change. |
| `rest.withinSuperset` | no | catalog | Seconds of rest after each exercise of a superset pair, before its partner. | A block without it rests like a training day block of its skill. |
| `rest.betweenSets` | no | catalog | Seconds of rest between the sets of a single exercise. | Same as `rest.withinSuperset`. |
| `rest.afterExercise` | no | catalog | Seconds of rest after the last set of an exercise or pair. The generator uses `betweenSets` instead when the next exercise trains the same region and primary muscle. | Focus trainings rest less than training days: warm-up 10 s instead of 30 s, leg axis stability 30 s instead of 60 s, full-body stability 45 s instead of 60 s. |
| `rest.afterBlock` | no | catalog `rest.afterBlock`, then `rest.afterExercise` | Seconds of rest between this block and the next block. It replaces the closing rest of the block's last exercise or pair. The last block of a workout has no trailing rest. The `WUSPEZIAL` catalog entry sets 30 s, so the special warm-up ends with 30 s in prevention trainings and in plan workouts, whatever block follows. | The special warm-up rests 30 s before the next block, while its own exercises rest 10 s. Plan workouts pass no template, so the catalog carries the value for both paths. |
| `superset` | no | catalog | `none`: no pairs. `muscles`: pairs opposing muscles. `drawOrder`: pairs neighbours in the order the block drew them; an exercise without a free neighbour trains alone. `drawOrderWithLeftovers`: pairs like `drawOrder`, then pairs the exercises that train alone with each other. A one-sided exercise always pairs with its other side. | Training days pair by muscles. Warm-up, mobility, foam roller, and cool-down trainings use `none`, prevention trainings `drawOrderWithLeftovers`, and leg axis stability `drawOrder`. |

### Picks and tags

A pick means: pick `count` branches by `tags`. A picks block holds one or more picks and draws them in template order, so `[{ "tags": ["SKILL_PREVENTION", "PREVENTION_SHOULDER"], "count": 3 }, { "tags": ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"], "count": 2 }]` trains 3 shoulder prevention branches, then 2 knee and hip prevention branches. The [Glossary](../specs/glossary.md) defines pick and picks block.

A pick lists `tags` and draws `count` units of matching branches. The app sorts the tags into tag groups. A tag group is the prefix the tag starts with, from the app's `TagGroups` constants, for example `SKILL` or `PREVENTION`. When two prefixes fit, the longer one wins, so `EQ_TYPE_WEIGHTS` belongs to `EQ_TYPE`.

A branch matches a pick when, for every tag group the pick names, the branch carries at least one of the listed tags of that group. A branch without a region tag matches every `REGION` tag. A pick with no tags matches every branch.

A template has no template-level `tags`. Each pick names its own. A prevention pick carries the prevention area tag, for example `PREVENTION_KNEE_HIP`, next to a `SKILL` tag such as `SKILL_PREVENTION`. The area tag narrows the pick to the branches of one body area.

In the shoulder prevention example below, the warm-up pick names `SKILL_WU`, `SKILL_WARM_UP`, `SKILL_WARM_UP_SPECIAL`, and `PREVENTION_SHOULDER`. A branch matches when it carries one of the three `SKILL` tags and the `PREVENTION_SHOULDER` tag.

### Rules

Rules 1 to 3 apply to duration and branches blocks, rules 5 to 7 to exercises blocks. The generator runs the cardio duration blocks of rule 1 and rejects the duration blocks of rule 2 until a follow-up implements them.

1. A block whose skill starts with `CARDIO` is a duration block. `duration` sets its length.
2. In any other duration block, `duration` / 60 is a minutes key of its [minutes table](#minutes-table) entry, `default` variant. For example, 600 seconds reads the key 10.
3. A branches block lists branches of its skill tree only.
4. The app rejects a template that breaks a rule and names the path of the error, for example `MOBGKS30.blocks[0].duration: 15 minutes is no key of MOB`.
5. An exercises block fails the whole workout when one of its exercises is missing from the exercise catalog, listed twice, or needs equipment the training place lacks. A missing or repeated exercise is a template error that names the block path. Missing equipment throws `NO_EXERCISES/EQUIPMENT` with the missing equipment, the error the athlete already knows from other workouts. A workout source can set the exercises rule `equipment: "ignored"` to skip the equipment check; the strength test does. The generator never drops or replaces a listed exercise.
6. Exercises blocks run in the strength test source only. The source passes the strength test builder for the skill of its lifts block, `TEST`, and a branch selecting block of a skill with a prescribed builder fails. A block that sets `sets`, `setDuration`, `values`, `rest` or `testSets` for a builder that does not read them fails, so the strength test never ignores an authored value. The strength test builder reads `testSets` only and fails without them.
7. A training day keeps every exercises block, also two of the same skill; only its branch selecting blocks keep the last block per skill.

## Skill catalog

The skill catalog is a separate data file with one entry per skill code. Its fields do not appear in a template. A block names its skill and inherits the entry:

1. **Skill properties**, such as skill tree, intensity, focus area, progression, and pain regions. A template cannot set them.
2. **Block defaults**: `countBy`, `fallbackToWholeTree`, `superset`, `sets`, and `rest`. A block field of the same name overrides them.

A template has no skill properties of its own. The focus area, progression, pain regions, and intensity of a bundled training come from the catalog entry of the skill code, which equals the template ID for the 13 bundled trainings.

The skill code also selects the set list builder: cardio, max strength, or the standard sets and rests. The strength test skill `TEST` has no catalog entry; its source passes the builder.

[ADR: Skill catalog](./skill-catalog.md) defines the entry type, every field, example entries, and the builders.

## Minutes table

The minutes table in `assets/data/generator/regions.json` turns a skill and minutes into picks. Plan creation uses it today. A duration block uses the same table and the same chooser, `PlanGenerator.getBranchesForWorkout`, so a trainer's minutes select branches like a plan day: direction balanced, with named exercises, and with tags that point into other trees.

1. The skill code selects the entry. `CARDIO_*` reads `CARDIO`, `MAX_STRENGTH` reads `MAX`, `SWR2` reads `SWR1`.
2. Children read the `child` variant, pro athletes `professional`, everyone else `default`.
3. The chooser takes the key nearest to `duration / 60` in that variant.

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

`STABILITY` has no entry and cannot be a duration block.

## Generation

The generator turns a template into a set list for one athlete. It resolves every block first, from the skill catalog and the training place. Then it applies the athlete's rules to the union of the picks block pools and runs the blocks in template order. A picks block skips every branch an earlier block of the workout used, so a drawn branch repeats no earlier branch. A branches block keeps its list, even when an earlier block used one of its branches.

Status: the generator runs `picks`, `branches` and cardio `duration` blocks, alone or mixed. A duration block of any other skill, the `order` field of any block, and the `bodyParts` field of a picks or duration block are accepted by the schema and rejected with error `OTHER/BLOCK_KIND`. The params name the block path and the kind or field, for example `["GKS.blocks[0]", "order"]`.

1. **Pool.** Each block's pool holds the branches of its skill's trees for the training place: the `withWeights` names when the place has weights, the `withoutWeights` names otherwise. Tree names are literal. For example, `STABILITY` without weights reads `GKS`. A special warm-up block (`WUSPEZIAL`) narrows its tree to the pain regions of the workout's prevention skills, which are the skills of the blocks whose catalog focus area is `PREVENTION`. Without `fallbackToWholeTree`, the pool keeps only the branches that match at least one pick of the block. A block whose pool ends up empty aborts the workout with `NO_EXERCISES/SKILL_TREE` and the block's skill code.
   - A pick that matches no branch draws nothing. No runtime check throws for it. `loadTemplates.spec.ts` asserts that every bundled block matches a branch at both training places, so that guard applies to bundled data only.
2. **Athlete rules.** The generator filters the union of the block pools by pains, equipment, age group, and gender, in this order. A template sets none of these rules. Muscle soreness filters nothing for a bundled training. There is no required equipment check: the per exercise equipment filter decides alone, so a training place without foam roller or foam ball keeps the branches its equipment allows. The workout aborts when a filter keeps no exercise, with `NO_EXERCISES` and the subtype of that filter (`PAIN`, `EQUIPMENT`, `AGE`, or `GENDER`).
3. **Body parts** (not yet in the generator). The block's `bodyParts` filters its pool. The skill catalog has no `regionFilter` field yet, so a follow-up adds it with this step. Both levels follow one rule:
   - A level keeps the branches tagged with a selected value and the branches without a tag of that level. With both levels set, a branch passes both.
   - A `fallbackToWholeTree` draw stays inside the filtered pool too.
   - When a level keeps no branch, the block ignores that level and draws from the pool before it. Full-body stability (`GKS`) has no lower body or core branch, so a lower body workout fills that block from its whole pool.
   - `fullBody` counts as its own region. All four regions, or none, keep every branch.
   - The generator drops unselected region tags from the picks and merges picks that become equal.
4. **Choose.**
   - A picks block draws its picks in template order. Each pick draws `count` units of the branches that match its tags. `countBy` sets the unit: `exercises` counts one exercise per unit, `entries` counts one exercise entry per unit (a one-sided exercise is two entries, left and right), and `pairs` draws superset pairs. With `fallbackToWholeTree`, a pick that finds too few matches draws the rest from the block pool. The weighted pairs of a `pairs` block come last.
   - A cardio duration block draws one branch of its zone's tree, as plan creation stores one branch per cardio day. The draw takes a branch that the athlete's pains, age group, gender, muscle soreness, equipment and level allow, then runs the branches block rules below on it. Without an allowed branch, the block hands on a blocked one and the branches block rules treat it as a training day treats a blocked stored branch: lower body soreness, for example, swaps the block for the CARDIO_5 run of at most 20 minutes. The cardio builder fills the block's `duration`.
   - Any other duration block runs the [minutes table](#minutes-table) chooser. Not yet supported.
   - A branches block keeps its list. The branch lookup index supplies each branch, and the generator drops a listed branch the athlete's pains, age group or gender rule out, as plan creation does before it stores a branch. When a rule drops every listed branch, the workout aborts with `NO_EXERCISES` and the subtype of that rule (`PAIN`, `AGE`, or `GENDER`), as for the picks pool in step 2. The block then runs the rules of [Plan Workout Generation](../specs/session/plan-workout-generation.md#generating-the-session): soreness, equipment and level filters, the [duplicate exercise](./duplicate-exercises.md) check inside the block, and the replacement of blocked branches. Each timing value comes from the block, else from the training day defaults of the skill, which fill the sets and rests that cardio and max strength entries leave out of the catalog.
5. **Order.** The exercises keep the order in which the block drew them. `order: "muscleGroups"` is not yet supported.
6. **Branch level.** Every branch resolves to the exercise of the athlete's branch level. A branch whose exercise the workout already holds is skipped, so no exercise repeats.
7. **Set list.** The block's `superset` pairs its exercises: `none`, `muscles`, `drawOrder`, or `drawOrderWithLeftovers`. `sets` and `setDuration` come from the block, and a block's `rest` fields override the catalog's `rest` field by field. The set list builder then emits the sets.

The preview estimates a block's length from the generated set list: all work and rest entries, with a repetition counted as 5 seconds. A single exercise takes sets × set duration + (sets − 1) × `betweenSets` + one closing rest. The last exercise of the workout has no closing rest.

## Examples

### Example 1: focus training and prevention training

The bundled full-body stability training draws 4 entries with weights, and 3 upper body + 2 full body entries without weights:

```json
{
  "aiwl": 1,
  "id": "GKS",
  "name": { "en": "Full body stability", "de": "Ganzkörperstabilität" },
  "blocks": [
    {
      "kind": "picks",
      "skill": "GKS",
      "values": "exercise",
      "picks": {
        "withWeights": [{ "tags": [], "count": 4 }],
        "withoutWeights": [
          { "tags": ["REGION_UPPER_BODY"], "count": 3 },
          { "tags": ["REGION_FULL_BODY"], "count": 2 }
        ]
      },
      "rest": { "afterExercise": 45, "betweenSets": 45 }
    }
  ]
}
```

The skill catalog entry `GKS` supplies skill tree, intensity, `countBy`, `fallbackToWholeTree`, `sets`, `superset`, and the rests 45 s, 90 s, and 60 s. The block overrides `betweenSets` and `afterExercise`, both to 45 s, so every rest of the training lasts 45 s. The block also sets `values` to `exercise`, so each exercise trains with its own repetitions or duration instead of the `GKS` intensity range.

The bundled shoulder prevention training:

```json
{
  "aiwl": 1,
  "id": "PREVSHOULDER",
  "name": { "en": "Shoulder prevention", "de": "Schulterprävention" },
  "blocks": [
    {
      "kind": "picks",
      "skill": "WUSPEZIAL",
      "picks": [
        { "tags": ["SKILL_WU", "SKILL_WARM_UP", "SKILL_WARM_UP_SPECIAL", "PREVENTION_SHOULDER"], "count": 3 }
      ]
    },
    {
      "kind": "picks",
      "skill": "PREVSHOULDER",
      "picks": [{ "tags": ["SKILL_PREVENTION", "PREVENTION_SHOULDER"], "count": 3 }],
      "superset": "drawOrderWithLeftovers"
    }
  ]
}
```

The special warm-up block draws 3 exercises from `WUSPEZIAL`, narrowed to the shoulder. Its exercises rest 10 s, and the catalog `afterBlock` of `WUSPEZIAL` makes the rest before the prevention block 30 s. The prevention block draws 3 pairs from the prevention skill trees with and without weights (`PREV`, `PREVKG`) and trains 2 sets. It pairs in draw order, where training days pair by muscles, so it sets `superset`. It sets no `values`: the `PREV` intensity of the prevention skills reads the exercise values, so each exercise keeps its authored repetitions and durations. The other prevention trainings do the same, and leg axis stability (`BAS`) sets `"superset": "drawOrder"`.

### Example 2: training day

This example shows the target stored format: one branches block per skill, in the plan's section order. The skill defaults supply sets, rests, and supersets.

Training days do not store AIWL yet. With the AIWL generator flag on, the generator writes the stored branch entries and minutes as branches blocks of this shape at generation time, without the `order` field. The training day finish rules sort the exercises by muscle groups instead. The generator rejects `order` with `BLOCK_KIND` until a follow-up implements it.

```json
{
  "aiwl": 1,
  "id": "PLAN_SWR1_45",
  "name": { "en": "Hypertrophy", "de": "Muskelaufbau" },
  "blocks": [
    { "kind": "branches", "skill": "WU", "duration": 600, "order": "muscleGroups", "branches": ["11", "14", "17", "20", "23"] },
    { "kind": "branches", "skill": "SWR1", "duration": 1500, "order": "muscleGroups", "branches": ["201", "205", "212", "219", "230", "244"] },
    { "kind": "branches", "skill": "GKS", "duration": 600, "order": "muscleGroups", "branches": ["301", "307", "315"] }
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

No trainer editor exists yet, and the generator rejects duration blocks of skills other than the cardio zones until a follow-up implements them. This example shows the planned format.

The trainer chooses:

1. Skills with minutes: mobility 10 minutes, full-body stability 20 minutes.
2. Body region: upper body.

The editor writes one duration block per skill:

```json
{
  "aiwl": 1,
  "id": "MOBGKS30",
  "name": { "en": "Mobility and stability", "de": "Mobilität und Stabilität" },
  "blocks": [
    { "kind": "duration", "skill": "MOB", "duration": 600, "setDuration": 60, "order": "muscleGroups", "bodyParts": { "regions": ["upperBody"] } },
    { "kind": "duration", "skill": "GKS", "duration": 1200, "order": "muscleGroups", "bodyParts": { "regions": ["upperBody"] } }
  ]
}
```

Generation for an adult athlete at a training place with weights:

| Step | Mobility block | Full-body stability block |
|---|---|---|
| Pool | `MOB` skill tree | `GKS` skill tree |
| Minutes table | `MOB.default["10"]`: upper body 4, lower body 4, full body 2 | `GKS.default["20"]`: full body 4, upper body 2 |
| Body regions | one pick of 10 entries from upper body branches and branches without region tag | one pick of 6 entries from the same kind of branches |
| Set list | 1 set; 60 s per set; 10 s rests | 2 sets; rests 45, 90, 60 s; no supersets |

The workout runs 30 minutes as planned. The mobility estimate is 10 × 60 s per set + 10 × 10 s rest = 700 s, about 12 minutes. As the last block, the mobility block would lose its final rest and take 690 s. The preview shows the estimate next to the planned 10 minutes.

## Conformance

Three specs pin the bundled trainings:

- `src/data/loadTemplates.spec.ts` pins the resolved values and pools of the 13 bundled templates.
- `src/features/training/generators/resolveTemplate.spec.ts` pins how the resolver turns template blocks into pools and values.
- `src/features/training/generators/shortWorkoutEquipment.spec.ts` pins the foam roller training (BR) at a place without foam roller or foam ball.

The bundled trainings reproduce the set lists of the old `focusTrainings.json` file, with one exception: the foam roller training at a place without foam roller or foam ball. Before the switch, an athlete in that situation got the error `NO_EXERCISES/EQUIPMENT`. Now the generator draws the BR branches that the athlete's equipment allows, for example branch 565.

`src/features/training/generators/bundledTemplateRests.spec.ts` pins the rests of the bundled templates: the special warm up, the PREV prevention entries, GKS, BAS and the STABILITY supersets. The plan workouts keep the rests of the hard-coded plan maps, because only the short workout path passes template rests to the generator. Two values reach plan workouts through the catalog and the intensity instead: the special warm-up closes with the 30 s `afterBlock` of the `WUSPEZIAL` catalog entry, and prevention blocks start at the exercise values, since the `PREV` intensity no longer overrides them.

`src/features/training/workoutGenerator/shortWorkoutGeneration.spec.ts` pins the cardio duration blocks: the draw by equipment and pain, the CARDIO_5 swap with lower body soreness, and the filled length. Plan profiles and duration blocks of other skills remain future work. They need their own specs once the generator supports them.

## Related standards

No open standard describes a workout template that a generator resolves per athlete. The existing formats describe fixed steps:

- **Schema.org `ExercisePlan`** (subtype of `PhysicalActivity`): an open vocabulary for exercise prescriptions.
- **Garmin FIT** (Flexible and Interoperable Data Transfer) workout files: binary, the de facto device format, with `workout_step` messages and repeat steps.
- **Apple WorkoutKit**: structured workouts for Apple Watch, mostly endurance.
- **HL7 FHIR** (Fast Healthcare Interoperability Resources) Physical Activity: clinical exercise prescriptions.

AIWL follows none of them. The set list the generator produces fits fixed steps better than a template does. [ADR: Final workout JSON schema](./final-workout-json-schema.md) plans a format for the set list.

## Pros and cons

- Pro: one format for bundled trainings, training days, and trainer workouts. The generator reads the bundled trainings through it today, and training days behind the AIWL generator flag.
- Pro: the AIWL path reproduces the 13 bundled trainings, except BR at a place without foam roller or foam ball.
- Pro: templates stay short, since the skill catalog supplies the skill values.
- Con: the generator supports picks, branches and cardio duration blocks only. Other duration blocks, and the `order` and `bodyParts` fields, fail with `BLOCK_KIND` until a follow-up implements them.
- Con: training days still store branch entries and minutes. The generator runs them as a stored day workout, and only with the AIWL generator flag on. With the flag off, training days run the old path.
- Con: `duration` means a length or a minutes table key, depending on the block type.
- Con: the generator picks `afterExercise` or `betweenSets` for the rest after an exercise, by the next exercise. A template that wants one rest after every exercise sets both fields to the same value.
- Con: the bundled templates deviate from the catalog rests. `PREV` rests 30 s between sets and after each exercise. Full-body stability rests 45 s everywhere. Leg axis stability rests 30 s between sets and after each exercise. `STABILITY` rests 30 s between sets and pairs its exercises in draw order. The shoulder, knee, wrist, ankle, and spine trainings keep the catalog rests in their prevention block.
- Con: the full-body stability block sets `values` to `exercise`, so it ignores the intensity range of its skill. Plan workouts that use the same skill keep the range.

## Open questions

- **`STABILITY` in trainer workouts.** `STABILITY` has no minutes table entry, so a trainer cannot add it by minutes. A follow up decides whether it gets an entry.
- **Foam roller minutes without exercises.** Plan creation can book minutes for a skill without storing exercises for it, for example 5 minutes of foam roller on a cardio day. The athlete sees neither the exercises nor the minutes, since the generator builds blocks from stored exercises only (`TrainingGenerator.ts:887`). AIWL expresses the day with `{ "kind": "duration", "skill": "BR", "duration": 300 }`. A follow up fixes plan creation.

## More information

ADRs: [Skill catalog](./skill-catalog.md), [Final workout JSON schema](./final-workout-json-schema.md). Specs: [Plan Workout Generation](../specs/session/plan-workout-generation.md), [Glossary](../specs/glossary.md).
