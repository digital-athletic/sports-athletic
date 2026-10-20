# Athletic Intelligence Template Language

## Why & What

The **Athletic Intelligence Template Language** (AITL) is the JSON format that describes one workout. An AITL **template** lists the **blocks** of a workout in order. Each block names its skill, where its branches come from, and how its sets, rests, supersets, and exercise order look. The generator turns a template into a set list for one athlete.

AITL describes every workout the app runs:

1. a focus training, for example full body stability,
2. a prevention training, for example shoulder prevention,
3. the workout of one plan training day, for example warm up, hypertrophy, and full body stability,
4. a workout a trainer composed.

A template describes one workout and nothing else:

- **No strategy.** Sections, season phases, weekdays, the focus of a training day, and the minute split per skill belong to plan creation. Plan creation decides what a day trains; AITL describes the workout of that day.
- **No athlete rules.** Pains, muscle soreness, equipment, age group, gender, fitness level, branch progress, and max strength eligibility belong to the generator. No template field switches them on or off.
- **No skill properties.** Intensity, focus area, progression, pain regions, and skill tree belong to the skill. The **skill catalog** holds them; a block names its skill and inherits them.

The app ships its focus trainings and prevention trainings as AITL templates in `assets/data/generator/focusTrainings.json`. This spec simplifies that format, which requires a rewrite of the stored file, and lets the app accept further templates at runtime.

## Problem

1. The app reads templates only from its bundled data. A new workout needs an app release.
2. The bundled templates serve two purposes. They describe workouts, and they act as a registry of skill properties: plan workouts look up intensity, pain regions, focus area, and progression by skill code in the template of the same key. A template key therefore must not equal a skill code, and a skill's properties live in a workout file.
3. A template names skill trees in two places: `skillTrees` and `tags` on the template build a shared pool, `skillTree` on a block adds to it. A template with a mobility block and a full body stability block can draw a stability branch into the mobility block.
4. Prevention templates state their region three times: in the key (`PREVSHOULDER`), in `regions`, and in `tags`.
5. The rest keys `pause.superset`, `pause.sets`, and `pause.exercise` reuse the names of the block fields `superset` and `sets`.
6. A block sets its size as a branch count. A trainer thinks in minutes per focus.
7. A template has no total duration and no body region restriction.
8. The short workout generator passes no minutes to the set list builder, so a template cannot contain cardio.
9. A plan training day stores its workout in a second format: pre-selected branches and minutes per skill, with sets, rests, supersets, and order taken from per-skill values in the generator. A template can express none of these.

## Solution

1. The app reads templates from the bundled set and from an **imported set**. Both pass the same validation and the same generator.
2. The skill properties move from the templates into the skill catalog. A block names its `skill` and inherits skill tree, intensity, focus area, progression, pain regions, and defaults.
3. The skill names the block's tree. Template `skillTrees`, template `tags`, block `skillTree`, and the shared pool disappear.
4. A block takes its branches from one of three sources: `picks`, the **minutes table** through `minutes`, or a fixed `branches` list.
5. A block that omits `sets`, `pause`, `superset`, `order`, or `fallback` gets the default of its skill.
6. The bundled templates move to the new format once, in the same change. The [compatibility check](#compatibility-check) proves they generate the same set lists as before.

Rejected alternatives:

- Keeping the old format next to the new one: two formats double validation, generator paths, and tests.
- Strategy fields such as sections, weekdays, or day focus: AITL would duplicate plan creation.
- Athlete fields such as a soreness switch: a template describes the workout, not who may train it.
- Skill properties per template, such as `intensity`: plan workouts need them per skill, and one skill would carry different values in different templates.
- Fixed exercise lists: an exercise ignores the athlete's level. A branch resolves to the exercise of the athlete's level, so `branches` lists branches.
- Fields for strength skill and cardio zone: the block's skill code already names both.

## Out of Scope

- Training strategy and plan creation
- Switching plan workouts to AITL. [Example 2](#example-2-plan-training-day) shows the mapping; the switch needs its own spec.
- Storing templates in the backend and syncing them to athletes
- The trainer editor and the athlete's start screen
- Body region and muscle filters per block

## Language

### Formal description

An AITL file maps template keys to templates. `?` marks an optional field; `[T, ...T[]]` a list with at least one entry.

```ts
type AitlFile = { [templateKey: string]: Template };

type Template = {
  aitl: 1;
  title: Text;
  description?: Text;
  requiredEquipment?: Equipment[];
  duration?: number;
  bodyRegions?: ("UPPER_BODY" | "CORE" | "LOWER_BODY" | "FULL_BODY")[];
  muscles?: Muscle[];
  blocks: [Block, ...Block[]];
};

type Block = {
  skill: SkillCode;
  picks?: [Pick, ...Pick[]];
  picksWithoutWeights?: [Pick, ...Pick[]];
  minutes?: number;
  branches?: [BranchId, ...BranchId[]];
  draw?: "slots" | "exercises" | "pairs";
  fallback?: boolean;
  sets?: number;
  work?: number;
  pause?: { inSet: number; betweenSets: number; afterExercise: number };
  superset?: "none" | "muscles" | "drawOrder" | "drawOrderAll";
  order?: "draw" | "muscleGroups";
};

type Pick = { tags: Tag[]; count: number };

type Text = { de?: string; en?: string };
```

`SkillCode`, `Tag`, `Equipment`, `Muscle`, and `BranchId` are strings from the app data. Times are seconds, `minutes` and `duration` minutes.

Rules across fields:

1. A block sets at most one of `picks` and `branches`. A block with neither sets `minutes` and reads its picks from the minutes table.
2. A block that draws, through `picks` or the minutes table, sets `draw`. A `branches` block sets neither `draw` nor `fallback`.
3. `picksWithoutWeights` requires `picks`.
4. A block whose skill code starts with `CARDIO` sets `minutes`.
5. When every block sets `minutes`, the block minutes add up to `duration`.
6. A bundled template sets both title languages.

### Fields

#### Template

| Field | Options | Default | Meaning |
|---|---|---|---|
| `aitl` | `1` | | Language version. The app rejects versions it does not know. |
| `title` | `de`, `en` | | Title. The app shows the app language, else the other one. |
| `description` | `de`, `en` | none | One or two sentences. |
| `requiredEquipment` | equipment | none | The workout uses one of these. The generator aborts at a place without any. |
| `duration` | 15 to 75 | none | Total minutes. |
| `bodyRegions` | `UPPER_BODY`, `CORE`, `LOWER_BODY`, `FULL_BODY` | all | Body regions the workout trains. |
| `muscles` | muscles of the exercise catalog | all | Muscles the workout prefers. |
| `blocks` | blocks | | The workout parts, in order. |

#### Block

| Field | Options | Default | Meaning |
|---|---|---|---|
| `skill` | skill code of the [skill catalog](#skill-catalog) | | The skill the block trains. Selects skill tree, intensity, set list builder, and defaults. |
| `picks` | picks | none | What the block draws from its skill tree. |
| `picksWithoutWeights` | picks | `picks` | Replaces `picks` at a place without weights. |
| `minutes` | minutes | none | Length of the block. Without `picks` and `branches`, a key of the [minutes table](#minutes-table). |
| `branches` | branch IDs of the skill tree | none | The block trains these branches, in this order. |
| `draw` | `slots`, `exercises`, `pairs` | | How `count` counts: `slots` counts a one-sided exercise twice, `pairs` counts superset pairs. |
| `fallback` | `true`, `false` | `false` | `true`: once the picks run out of matching branches, the block draws from its whole tree. |
| `sets` | 1 or more | the skill's set count | Sets per exercise. |
| `work` | seconds | the intensity | Fixed work per set. |
| `pause.inSet` | seconds | the skill's in-set pause | Rest after each exercise of a superset pair. |
| `pause.betweenSets` | seconds | the skill's single-exercise rest | Rest between the sets of an exercise without a partner. |
| `pause.afterExercise` | seconds | the skill's after-set pause | Rest after the last set of an exercise or pair. |
| `superset` | `none`, `muscles`, `drawOrder`, `drawOrderAll` | `muscles` for superset skills, else `none` | `muscles` pairs opposing muscles, `drawOrder` pairs in draw order, `drawOrderAll` also pairs the leftover singles. A one-sided exercise always pairs with its other side. |
| `order` | `draw`, `muscleGroups` | `draw` | `muscleGroups`: big muscle groups first, rotating body regions, max strength lower body first. |

The rest names follow the rest types of [Session Set Structure](./session-set-structure.md), which also lists the skill defaults.

#### Pick

| Field | Options | Meaning |
|---|---|---|
| `tags` | tags | A branch needs one listed tag of every tag group the pick names. A branch without a region tag matches every region. |
| `count` | 1 or more | Branches, slots, or pairs, as `draw` says. |

### Skill catalog

The skill catalog, `assets/data/generator/skills.json`, holds one entry per skill code. A block inherits every value of its skill's entry.

| Field | Content | Moves from |
|---|---|---|
| `title`, `description` | German and English, one sentence each | new |
| `skillTree` | the tree the skill draws from; weighted trees swap to their bodyweight tree at a place without weights | template `skillTrees` and `tags` |
| `intensity`, `intensityWithoutWeights` | intensity configuration; default `DEFAULTKG` | template `intensity`, `intensityWithoutWeights` |
| `focusArea` | the area the stats credit the training time to | template `focusArea` |
| `progression` | `false`: exercises keep their values and ask for no feedback | template `progression` |
| `painRegions` | prevention skills: the pain regions the skill protects | template `regions` |
| `regionFlag` | whether the body region filter applies | new |
| `defaults` | `draw`, `fallback`, `work`, `order` for a block a trainer editor creates | new |
| `note` | max strength only: "Advanced and pro only, from 16, with weights. Everyone else trains hypertrophy." | new |

The skill tree swaps at a place without weights: `GKS` to `GKSKG`, `SWR1` and `SWR2` to `SWR1KG`, `SA` to `SAKG`, `SK` to `SKKG`, `PREV` to `PREVKG`. A joint-specific prevention skill such as `PREVSHOULDER` draws from `PREV` and `PREVKG` together.

### Skill code

The block's skill code selects the set list builder:

| Skill code | Set list |
|---|---|
| `CARDIO_1_SHORT` to `CARDIO_5` | intervals or a steady run that fill `minutes`, per [Cardio Training System](./cardio-training-system.md) |
| `MAX`, `MAX_STRENGTH` | warm up ladder, working sets, support exercises in the breaks, per [Max Strength Training](../progression/max-strength-progression.md) |
| every other code | sets and rests per [Session Set Structure](./session-set-structure.md) |

`"skill": "SWR1"` therefore makes a hypertrophy block, `"skill": "CARDIO_2"` a zone 2 block. One focus of a workout is one block.

### Minutes table

Plan creation turns minutes per skill into picks through the minutes table in `assets/data/generator/regions.json`. A block with `minutes` and without `picks` or `branches` reads the same table:

1. The block's skill code selects the entry, for example `GKS`.
2. Children read the `child` variant, pro athletes `professional`, everyone else `default`. A missing variant falls back to `default`.
3. `minutes` selects the key. An imported template names a key of the `default` variant.
4. The picks under that key become the block's picks.

The keys set the minutes a focus offers:

| Entry | Minutes |
|---|---|
| `MOB`, `WU`, `CD`, `BR`, `BAS` | 5, 10 |
| `PREVSHOULDER`, `PREVKNEE`, `PREVWRIST`, `PREVANKLE`, `PREVSPINE` | 5, 10, 15 |
| `GKS` | 5 to 40, in steps of 5 |
| `SWR1` | 20 to 55, in steps of 5 |

`STABILITY` has no entry. The plan's set and rest values shaped the counts, so a block with other values runs longer or shorter than its `minutes`. The [estimated duration](#estimated-duration) shows the difference.

## Algorithm

### Loading

The app rejects a template, with an error naming the cause, when:

1. the template breaks the [formal description](#formal-description) or a rule across fields,
2. the template names an unknown skill code, branch, tag, or `aitl` version,
3. an imported template key equals a bundled template key,
4. a `minutes` value without `picks` or `branches` is no key of the minutes table entry, or
5. a block lists a branch outside its skill tree.

The app stores an accepted template under its key. A second imported template with the same key replaces the first.

### Generation

Every template runs through the same eight steps, block by block, in block order. A step whose field the template omits keeps today's behavior: without `bodyRegions` and `muscles`, steps 4 and 5 keep every branch; without `order`, step 7 keeps the drawn order; a `branches` block skips steps 4 to 6.

1. **Pool.** The block draws from the skill tree of its skill, per the [skill catalog](#skill-catalog). A special warm up block (`WUSPEZIAL`) narrows its tree to the pain regions of the template's prevention block.
2. **Branch source.** The block reads its `picks`, its minutes table picks, or its `branches`.
3. **Athlete rules.** The generator applies the rules of [Plan Workout Generation](./plan-workout-generation.md):
   - Pains, soreness, equipment, age group, gender, and fitness level filter the pool and the listed branches.
   - A blocked listed branch takes a replacement from the block's pool, from the same body region where possible.
   - Prevention and special warm up blocks replace all branches or drop out.
   - A blocked cardio block turns into steady zone 5 cardio of at most 20 minutes.
   - A max strength block needs fitness level advanced or pro, age 16 or older, and weights at the place. Otherwise it trains `SWR2`.
   - Every branch resolves to the exercise of the athlete's level and progress.
4. **Body region filter.** The filter applies to drawing blocks whose skill carries the region flag. Leg axis stability carries none.

   | `bodyRegions` | Kept branches |
   |---|---|
   | none, or `FULL_BODY` | all |
   | `UPPER_BODY`, `CORE`, and `LOWER_BODY` | all |
   | any other | branches tagged with a selected region, plus branches without a region tag |

   A branch tagged full body counts as its own region, so `UPPER_BODY` removes it. The generator also removes region tags from the block's picks and merges picks that become equal, since the minutes table splits many entries by region.
5. **Muscle filter.** The filter applies to drawing blocks that keep at least one branch with a selected muscle.
6. **Draw.** Each pick draws its `count` from the matching branches, as `draw` and `fallback` say. A pick left with too few branches after steps 4 or 5 takes the rest from the block's pool after step 3.
7. **Order.** A block with `order: "muscleGroups"` orders its exercises and pairs as in [Plan Workout Generation](./plan-workout-generation.md), ordering rules 2 and 3. Such a block also avoids opening with the exercise that ended the block before.
8. **Set list.** The [skill code](#skill-code) selects the builder. A cardio block passes `minutes` to it.

An empty pool after step 3 aborts with the existing short workout errors.

### Estimated duration

The workout summary estimates a length when it gets no start and end time: it adds each entry's `duration`, or `repetition` × 5 seconds, over all sets, plus the pause entries. A generated set list holds the same entries, so the app runs the same calculation before the workout starts and labels the result as an estimate.

| Block content | Minutes |
|---|---|
| Single exercise | sets × (work + `betweenSets`) + `afterExercise` |
| Superset pair | per exercise: sets × (work + `inSet`) + `afterExercise` |
| Cardio | `minutes` |

### Migration of the bundled templates

The change rewrites `assets/data/generator/focusTrainings.json` and creates `assets/data/generator/skills.json`. Per bundled template:

| Old field | New place |
|---|---|
| `skillTrees`, `tags` | removed; the block's `skill` names the tree, and every prevention pick already carries the region tag |
| `intensity`, `intensityWithoutWeights`, `focusArea`, `progression`, `regions` | the skill catalog entry of the template key, `regions` as `painRegions` |
| block `skill` | required; set to the template key where the block had none |
| block `skillTree` | removed; `"skill": "WUSPEZIAL"` names the special warm up tree |
| `pause.superset`, `pause.sets`, `pause.exercise` | `pause.inSet`, `pause.betweenSets`, `pause.afterExercise` |
| `"fallback": false` | removed; `false` is the default |
| none | `"aitl": 1` |

The code that reads skill properties from templates reads the skill catalog instead: the intensity lookup by skill, the pain regions of prevention skills, the focus area for stats, and the progression check. A template key then means nothing outside its template.

### Compatibility check

The team generates every bundled template with a fixed random seed for a fixed set of athletes, before and after the migration. The set lists must match in exercises, order, sets, work, and rest. Plan workouts run the same check, since they read intensity, pain regions, focus area, and progression from the skill catalog afterwards.

## Examples

### Example 1: focus and prevention training

The bundled full body stability training:

```json
"GKS": {
  "aitl": 1,
  "title": { "en": "Full body stability", "de": "Ganzkörperstabilität" },
  "blocks": [
    {
      "skill": "GKS",
      "draw": "slots",
      "picks": [{ "tags": [], "count": 4 }],
      "picksWithoutWeights": [
        { "tags": ["REGION_UPPER_BODY"], "count": 3 },
        { "tags": ["REGION_FULL_BODY"], "count": 2 }
      ],
      "fallback": true,
      "sets": 2,
      "pause": { "inSet": 45, "betweenSets": 90, "afterExercise": 45 },
      "superset": "none"
    }
  ]
}
```

The skill catalog entry `GKS` holds focus area, intensity, and progression.

The bundled shoulder prevention training:

```json
"PREVSHOULDER": {
  "aitl": 1,
  "title": { "en": "Shoulder prevention", "de": "Schulterprävention" },
  "blocks": [
    {
      "skill": "WUSPEZIAL",
      "draw": "exercises",
      "picks": [
        {
          "tags": ["SKILL_WU", "SKILL_WARM_UP", "SKILL_WARM_UP_SPECIAL", "PREVENTION_SHOULDER"],
          "count": 3
        }
      ],
      "sets": 1,
      "pause": { "inSet": 10, "betweenSets": 10, "afterExercise": 10 },
      "superset": "muscles"
    },
    {
      "skill": "PREVSHOULDER",
      "draw": "pairs",
      "picks": [{ "tags": ["SKILL_PREVENTION", "PREVENTION_SHOULDER"], "count": 3 }],
      "sets": 2,
      "pause": { "inSet": 30, "betweenSets": 60, "afterExercise": 60 },
      "superset": "drawOrderAll"
    }
  ]
}
```

The skill catalog entry `PREVSHOULDER` holds `painRegions: ["SHOULDER"]`, intensity `PREV`, and focus area `PREVENTION`.

Both templates pass every [generation](#generation) step with today's behavior:

| Step | `GKS` | `PREVSHOULDER` |
|---|---|---|
| Pool | `GKS`, or `GKSKG` without weights | warm up: `WUSPEZIAL` narrowed to the shoulder; prevention: `PREV` and `PREVKG` |
| Branch source | `picks` | `picks` |
| Athlete rules | pains, equipment, age group, gender | the same; one-sided exercises train the painful side |
| Order | `draw` | `draw` |
| Set list | 2 sets; rests 45, 90, 45 s; no supersets | warm up: 1 set, 10 s rests; prevention: 3 pairs, 2 sets |

### Example 2: plan training day

A stored plan training day maps to AITL field by field:

| Training day | AITL |
|---|---|
| pre-selected branches per skill | one block per skill with `skill` and `branches` |
| minutes per skill | `minutes` per block, their sum as `duration` |
| fixed section order | block order |
| sets, rests, supersets from the skill | omitted, so the skill defaults apply |
| exercise order of plan workouts | `order: "muscleGroups"` |
| weekday, focus, equipment | no field: strategy and plan bookkeeping |

A 45 minute hypertrophy day with warm up 10, hypertrophy 25, and full body stability 10 minutes:

```json
{
  "PLAN_SWR1_45": {
    "aitl": 1,
    "title": { "de": "Muskelaufbau", "en": "Hypertrophy" },
    "duration": 45,
    "blocks": [
      { "skill": "WU", "minutes": 10, "branches": ["11", "14", "17", "20", "23"], "order": "muscleGroups" },
      { "skill": "SWR1", "minutes": 25, "branches": ["201", "205", "212", "219", "230", "244"], "order": "muscleGroups" },
      { "skill": "GKS", "minutes": 10, "branches": ["301", "307", "315"], "order": "muscleGroups" }
    ]
  }
}
```

The branch IDs show the format; plan creation writes the real ones.

| Block | Skill defaults | Athlete rules at the session |
|---|---|---|
| Warm up | 1 set; rests 10, 10, 30 s | level picks each exercise |
| Hypertrophy | 2 sets; rests 30, 90, 60 s; muscle supersets; leading set at 70% for weighted pairs | a squat blocked by knee soreness takes a lower body replacement from `SWR1` |
| Full body stability | 2 sets; rests 45, 90, 60 s; no supersets | `GKSKG` at a place without weights |

A max strength day names `"skill": "MAX"` in the middle block. The set list builder then adds the warm up ladder and the support exercises.

### Example 3: a trainer composes a workout

The editor asks three questions and writes one template from the answers:

| Question | Options | Field |
|---|---|---|
| How long should the workout be in total? | 15 to 75 minutes | `duration` |
| Which focuses (skill trees) should the workout contain, and how long should each focus be? | skills of the catalog; per skill its minutes table keys | one block per focus: `skill`, `minutes` |
| Which body regions should the workout train? | upper body, core, lower body, full body | `bodyRegions`: `UPPER_BODY`, `CORE`, `LOWER_BODY`, `FULL_BODY` |

The trainer answers:

1. 30 minutes
2. Mobility 10 minutes, full body stability 20 minutes
3. Upper body

The editor writes the template after the third answer:

```json
{
  "MOBGKS30": {
    "aitl": 1,
    "title": { "de": "Mobilität und Stabilität", "en": "Mobility and stability" },
    "duration": 30,
    "bodyRegions": ["UPPER_BODY"],
    "blocks": [
      { "skill": "MOB", "minutes": 10, "draw": "slots", "work": 60 },
      { "skill": "GKS", "minutes": 20, "draw": "slots", "fallback": true }
    ]
  }
}
```

`draw`, `fallback`, and `work` come from the catalog defaults; sets, rests, and supersets from the skill defaults.

Loading:

| Rule | Result |
|---|---|
| `MOB` offers 10, `GKS` offers 20 | accepted |
| 10 + 20 = 30 = `duration` | accepted |
| `MOBGKS30` is no bundled template key | accepted |

Generation for an adult athlete with weights:

| Step | Mobility block | Full body stability block |
|---|---|---|
| Pool | `MOB` | `GKS` |
| Minutes table | `MOB.default["10"]`: upper body 4, lower body 4, full body 2 | `GKS.default["20"]`: full body 4, upper body 2 |
| Body region filter | one pick of 10 slots from upper body branches and branches without region tag | one pick of 6 slots from the same kind of branches |
| Set list | 1 set; 60 s work; rests 10, 10, 10 s | 2 sets; rests 45, 90, 60 s; no supersets |

Estimate for the mobility block: 10 slots × (60 s work + 10 s rest) = 700 s, about 12 minutes. The app shows the estimate next to the planned 10 minutes. The stats credit the mobility minutes to mobility and the stability minutes to stability, since each block's skill carries its own focus area.

## Structure

- Bundled set and imported set feed one template lookup.
- The skill catalog feeds the template generator and the plan workout generator alike.
- The short workout generator reads the template, athlete profile, place equipment, skill trees, minutes table, and skill catalog, and writes the same set list as for any short workout.
- The minutes table lookup moves from plan creation into one function both generators call.
- Branch replacement, `orderExerciseUnits`, and the per-skill set and rest values move from the plan workout path into functions the short workout generator calls per block.
- The workout summary's estimate moves into one function that reads a set list. The summary and the template preview call it.
- The max strength check moves from plan creation into one rule both generators call.
- A trainer editor in trainer web reads the same skill catalog later.

## Open Questions

None.
