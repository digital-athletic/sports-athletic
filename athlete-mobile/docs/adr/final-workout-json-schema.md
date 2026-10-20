# ADR: Final workout JSON schema

Status: draft. The generator produces the final workout as internal TypeScript objects, a `GeneratedSetListEntry[]`, and has no JSON format for it. This ADR proposes that format. Nothing is implemented.

## Context

The generator turns an [AIWL](./athletic-intelligence-workout-language.md) template into a set list for one athlete. This ADR calls that set list the **final workout**: the exercises, sets, values, and rests the athlete works through, in order. After the session, the app stores the same entries again as the completed workout.

The app keeps both in internal shapes:

- **Generated set list** (`GeneratedSetListEntry` in `SetListEntry.ts`): a flat list of entries. Each entry carries `exerciseId`, `branchId`, `set` as `[current set, total sets]`, `skill`, and optional `repetition`, `duration`, `weight`, `weightType`, and `height`. A rest is an entry of its own, with a pause exercise ID and its `duration`.
- **Completed workout** (`CompleteWorkoutSchema` in `sync.schema.ts`): `id`, `timestamp`, `duration` in seconds, and the entries of the set list, each with `completed`, `skipped`, and `feedback.difficulty`.

Both shapes also carry generator and progression state, such as `tags`, `repetitionMAX`, `tooHardCount`, and `nextWeightPercentage`. The only export today is a CSV file of performed sets (`statisticsCsv.ts`).

A trainer, another app, or an analysis tool needs the final workout in a documented format. AIWL stays unchanged: it describes how the generator draws a workout, and this format describes the result.

## Decision drivers

- The format follows the conventions of AIWL: a format identifier with version, an `id`, camelCase values, `kind` discriminators, and seconds for every time value.
- The format holds every value the athlete sees: exercises, order, sets, repetitions, durations, weights, heights, and rests.
- The format mirrors the set list the app generates today, so an export is a direct mapping.
- One structure covers the planned final workout and the completed one.
- Generator and progression state stays out.

## Options

| Option | Fit for the final workout |
|---|---|
| 1. Export the internal shapes as they are | No conversion work, but the shapes mix workout values with generator and progression state, use uppercase enum values, and are not documented. |
| 2. [Schema.org](https://schema.org/ExercisePlan) `ExercisePlan` and `ExerciseAction` as JSON-LD (JSON for Linked Data) | Open vocabulary maintained by the schema.org community, read by search engines and many websites. Lacks weight, height, side, warm-up sets, and feedback. Details below. |
| 3. [IEEE 1752.1](https://standards.ieee.org/ieee/1752.1/6982/) physical activity (formerly Open mHealth) | IEEE standard since 2021. Records one activity episode: name, duration, distance, intensity, calories, steps. No sets or repetitions. |
| 4. [HL7 FHIR](https://hl7.org/fhir/) (Fast Healthcare Interoperability Resources) Physical Activity | Clinical exercise prescriptions and measures. Far heavier than a final workout needs. |
| 5. An own JSON format modeled on AIWL and the generated set list | Holds every value of the set list, follows the AIWL conventions, and maps from the app's shapes one to one. |

### Option 2 in detail: schema.org

Schema.org expresses the structure: `ExercisePlan` is a `CreativeWork`, so plans nest through `hasPart` and keep their order through `position`, and `repetitions`, `activityDuration`, and `restPeriods` hold the values of one set. `ExerciseAction` records a completed workout and links its plan through `exercisePlan`.

Five values have no schema.org property: weight per set (`workload` means energy, not kilograms), weight as a share of F-Max, height, side of a one-sided exercise, and feedback. They would need own JSON-LD terms that only our converters understand. Schema.org also describes `restPeriods` as "how often one should break from the activity", which does not match a rest length in seconds.

## Outcome

Option 5. The app does not apply schema.org now. The own format keeps the order and values of the set list, so a later converter to schema.org, Apple Health, or Google Health Connect can start from it.

### Schema

```ts
type FinalWorkout = {
  $schema?: string;
  finalWorkout: 1;
  id: string;
  templateId?: string;
  name: LocalizedText;
  blocks: [FinalBlock, ...FinalBlock[]];
  completion?: Completion;
};

type FinalBlock = {
  skill: SkillCode;
  steps: [Step, ...Step[]];
};

type Step =
  | {
      kind: "set";
      exerciseId: ExerciseId;
      branchId?: BranchId;
      set: [number, number];
      repetitions?: number;
      duration?: number;
      weight?: number;
      weightType?: "absolute" | "fMaxPercent";
      height?: number;
      status?: "completed" | "skipped";
      feedback?: "tooEasy" | "succeeded" | "tooHard";
    }
  | { kind: "rest"; duration: number; status?: "completed" | "skipped" };

type Completion = {
  completedAt: string;
  duration: number;
};

type LocalizedText = { en: string } & Record<string, string>;
```

`SkillCode`, `ExerciseId`, and `BranchId` are IDs from the app data. Every value the format defines itself uses camelCase. Every time value counts seconds. `completedAt` is an ISO 8601 date-time in UTC.

### Fields

| Field | Required | Meaning | Source in the app |
|---|---|---|---|
| `$schema` | no | URL of the JSON Schema for editor validation. | none |
| `finalWorkout` | yes | Format identifier and version. | none |
| `id` | yes | ID of the workout. | `CompleteWorkout.id`, or the ID the app gives the generated session |
| `templateId` | no | `id` of the AIWL template the generator used. | the bundled training key, or none for a training day |
| `name` | yes | Name of the workout, one text per language, `en` as fallback. | the template name |
| `blocks` | yes | The blocks of the workout, in order. | consecutive set list entries with the same `skill` |
| `blocks[].skill` | yes | Skill code of the block. | `skill` of the entries |
| `steps` | yes | Sets and rests in the order the athlete works through them. A superset shows as alternating sets of its two exercises. | the set list entries, in order |
| `kind` | yes | `set` or `rest`. | `rest` for an entry with a pause exercise ID, `set` for every other entry |
| `exerciseId` | yes, in a set | ID of the exercise. Cardio fill and interval entries carry their own exercise IDs. | `exerciseId` |
| `branchId` | no | Branch the exercise belongs to. Missing for placeholder entries such as the cardio fill. | `branchId`, dropped when it is the placeholder `-1` |
| `set` | yes, in a set | `[current set, total sets]`. A warm-up set counts as a set. | `set` |
| `repetitions` | no | Repetitions of the set. | `repetition` |
| `duration` | yes in a rest, else no | Seconds of a timed set or of a rest. | `duration` |
| `weight` | no | Weight of the set. `weightType` says how to read it. | `weight` |
| `weightType` | no | `absolute`: kilograms. `fMaxPercent`: percent of the exercise's F-Max. | `weightType`: `weightAbsolute` or `weightFMax` |
| `height` | no | Height, for example of a jump box. | `height` |
| `status` | no | Only in a completed workout. `completed` or `skipped`. | `completed`, `skipped` |
| `feedback` | no | Only in a completed workout, on the set the athlete rated. | `feedback.difficulty`: `TOO_EASY`, `SUCCEEDED`, `TOO_HARD` |
| `completion` | no | Present once the athlete finished the workout. | `CompleteWorkout` |
| `completion.completedAt` | yes | Date and time of the stored workout. | `timestamp` |
| `completion.duration` | yes | Length of the session in seconds. | `duration` |

These values of the app's shapes stay out of the format:

| App value | Reason |
|---|---|
| `tags`, `repetitionMAX` | Generator state during max strength generation |
| `tooHardCount`, `nextWeightPercentage`, `maxFRepetitions`, `maxFLevelAdjustment`, `feedback.streakCounter` | Progression state for the next session |
| `workoutId` on an entry | The entry sits inside its workout |
| `xpEarned`, `movedWeight`, `exerciseCount`, `userSkills` | Statistics the app derives from the workout |

### Example

A full-body stability block with two exercises, 2 sets each. The exercise and branch IDs and the values only show the format.

```json
{
  "finalWorkout": 1,
  "id": "workout-2026-10-20-0815",
  "templateId": "GKS",
  "name": { "en": "Full body stability", "de": "Ganzkörperstabilität" },
  "blocks": [
    {
      "skill": "GKS",
      "steps": [
        { "kind": "set", "exerciseId": "4711", "branchId": "301", "set": [1, 2], "duration": 30 },
        { "kind": "rest", "duration": 90 },
        { "kind": "set", "exerciseId": "4711", "branchId": "301", "set": [2, 2], "duration": 30 },
        { "kind": "rest", "duration": 45 },
        { "kind": "set", "exerciseId": "4720", "branchId": "307", "set": [1, 2], "repetitions": 12, "weight": 8, "weightType": "absolute" },
        { "kind": "rest", "duration": 90 },
        { "kind": "set", "exerciseId": "4720", "branchId": "307", "set": [2, 2], "repetitions": 12, "weight": 8, "weightType": "absolute" }
      ]
    }
  ]
}
```

The same workout after the session adds `status` to every step, `feedback` to the rated sets, and `completion`:

```json
{
  "completion": { "completedAt": "2026-10-20T06:41:12Z", "duration": 1560 }
}
```

## Pros and cons

- Pro: the format holds every value the athlete sees, without own extensions.
- Pro: an export maps the app's shapes one to one, so it needs no new generator logic.
- Pro: AIWL and the final workout share their conventions.
- Pro: a converter to schema.org or a health platform can start from one documented format.
- Con: no other software reads the format out of the box.
- Con: a superset shows only as alternating sets, as in the set list today. The format marks no pair.
- Con: a warm-up set shows only as one of the counted sets. The set list marks no warm-up set today.

## Open questions

- **Time of the workout.** Check whether the stored `timestamp` marks the start or the end of the workout.
- **ID of a generated session.** A planned final workout has no `CompleteWorkout.id` yet. Decide which ID the app writes before the session.
- **Superset and warm-up markers.** Decide whether the format adds explicit markers for superset pairs and warm-up sets, which the set list does not store today.
- **Exercise names.** The format carries exercise IDs only. Decide whether an export adds the exercise names for readers without the exercise catalog.
- **Schema.org converter.** Decide later whether a converter to schema.org (option 2) is worth building.

## More information

ADRs: [Athletic Intelligence Workout Language](./athletic-intelligence-workout-language.md), [Skill catalog](./skill-catalog.md). Specs: [Glossary](../specs/glossary.md).

Sources:

- [schema.org/ExercisePlan](https://schema.org/ExercisePlan), [schema.org/ExerciseAction](https://schema.org/ExerciseAction), [schema.org/PhysicalActivity](https://schema.org/PhysicalActivity)
- [IEEE 1752.1-2021](https://standards.ieee.org/ieee/1752.1/6982/), [Open mHealth physical activity schema](https://www.openmhealth.org/schemas/omh_physical-activity/)
