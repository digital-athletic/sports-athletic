# ADR: Set list in schema.org

Status: planning. This ADR maps the set list to an open vocabulary. Nothing is implemented.

## Context

The generator turns an [AIWL](./athletic-intelligence-workout-language.md) template into a set list for one athlete. The app stores the set list in its own shape, and the completed workout as the performed sets of that list. The only export today is a CSV file of performed sets (`statisticsCsv.ts`).

An athlete or a trainer who wants the workout in another app, in a health platform such as Apple Health or Google Health Connect, or in an analysis tool needs a format that other software reads. This ADR plans that format. AIWL stays unchanged: it describes how the generator draws a workout, and this format describes the result.

## Decision drivers

- An open vocabulary that other software already reads, maintained outside this project.
- The format holds every value the athlete sees: exercises, order, sets, repetitions, durations, weights, rests, and supersets.
- One structure for the planned set list and for the completed workout.
- A converter to Apple Health, Google Health Connect, or a device format can start from it later.
- A consumer that knows only the open vocabulary still reads the core of the workout.

## Options

The research for this ADR found these open candidates:

| Option | Maintainer and adoption | Fit for the set list |
|---|---|---|
| 1. [Schema.org](https://schema.org/ExercisePlan) `ExercisePlan` and `ExerciseAction` | Schema.org community, a W3C community group. Search engines and many websites read schema.org. | Covers workout structure, order, repetitions, durations, and rests. No properties for weight, side, warm-up set, or feedback. |
| 2. [IEEE 1752.1](https://standards.ieee.org/ieee/1752.1/6982/) physical activity (formerly Open mHealth) | IEEE standard since 2021 | Records one activity episode: name, duration, distance, intensity, calories, steps. No sets or repetitions. |
| 3. [HL7 FHIR](https://hl7.org/fhir/) (Fast Healthcare Interoperability Resources) Physical Activity | HL7, clinical systems | Clinical exercise prescriptions and measures. Far heavier than a set list needs. |

Device and platform formats such as Garmin FIT and Apple WorkoutKit are owned by one vendor and are no candidates. A later converter can target them.

## Outcome

Option 1, schema.org, written as JSON-LD (JSON for Linked Data). JSON-LD is plain JSON with an `@context` that names the vocabulary, so a consumer without JSON-LD support reads it as ordinary JSON.

### Can the set list follow schema.org exactly?

Partly. Schema.org has the types and properties for the structure and for most values:

- `ExercisePlan` is a `CreativeWork`, so plans nest through `hasPart` and keep their order through `position`.
- `repetitions`, `activityDuration`, and `restPeriods` hold the values of one set.
- `ExerciseAction` records a completed workout and links its plan through `exercisePlan`.
- Every `Thing` carries `additionalType`, a URL that refines the type, for example to mark a superset.

Five values of the set list have no schema.org property:

| Value | Why schema.org lacks it |
|---|---|
| Weight per set | `workload` means energy expenditure, not kilograms. |
| Weight as a share of F-Max | No property for a load relative to a maximum. |
| Height, for example of a jump box | No property. |
| Side of a one-sided exercise | No property. |
| Feedback after the last set | No property. |

The format adds these values as terms of an own vocabulary, declared in the `@context` next to schema.org. A schema.org consumer skips terms it does not know and still reads the rest of the workout. The format therefore uses schema.org wherever a property means the same thing, and an own term only for these five values.

### Structure

The set list becomes a tree of `ExercisePlan` nodes. Each level lists its parts in `hasPart`, with `position` counting from 1.

1. **Workout**: one `ExercisePlan` for the whole session.
2. **Block**: one `ExercisePlan` per AIWL block, for example warm-up or full-body stability.
3. **Exercise group**: a single exercise, or a superset marked through `additionalType`. A superset lists its two exercises in `hasPart`.
4. **Exercise**: one `ExercisePlan` per exercise, with the exercise ID and name.
5. **Set**: one `ExercisePlan` per set, with repetitions or duration, load, and the rest after the set.

Rests become values of the set before them. The app's set list stores each rest as its own entry with a pause exercise ID. The mapping moves that rest into `restPeriods` of the preceding set and drops the pause entry.

### Mapping of the planned set list

| Set list value | Schema.org | Own term | Notes |
|---|---|---|---|
| Session | `ExercisePlan` | | Root node |
| Workout name | `name` | | The AIWL template `name`, one value per language with `inLanguage` |
| Planned length | `activityDuration` | | ISO 8601 duration, for example `PT30M` |
| Block | `ExercisePlan` in `hasPart` | | |
| Skill of the block | `exerciseType` | | The skill name, for example "Full-body stability". The skill code goes into `identifier`. |
| Superset | `ExercisePlan` with `additionalType` | | `additionalType` points to the own vocabulary's `Superset` |
| Exercise ID | `identifier` | | The app's exercise ID |
| Exercise name | `name` | | `displayName` of the exercise |
| Muscles of the exercise | `associatedAnatomy` | | Optional. Schema.org expects an `AnatomicalStructure` with a `name`. |
| Set number | `position` | | `set[0]` of the entry. The set count is the number of set nodes. |
| Warm-up set | `additionalType` | | Points to the own vocabulary's `WarmUpSet` |
| Support exercise of max strength | `additionalType` on the exercise | | Points to the own vocabulary's `SupportExercise` |
| Repetitions | `repetitions` | | |
| Duration of a timed set | `activityDuration` | | ISO 8601, for example `PT60S` |
| Rest after the set | `restPeriods` | | `QuantitativeValue` with `unitCode` `SEC`. See open questions. |
| Weight in kilograms | | `load` | `QuantitativeValue` with `unitCode` `KGM` |
| Weight as a share of F-Max | | `load` | `QuantitativeValue` with `unitCode` `P1` (percent) |
| Height | | `height` | `QuantitativeValue` with `unitCode` `CMT` |
| Side | | `side` | `LEFT` or `RIGHT` |
| Cardio interval | Set node | | Each interval is a set with `activityDuration`, and the running rest becomes `restPeriods`. |

`unitCode` takes the codes of UN/CEFACT Recommendation 20, which schema.org prescribes for `QuantitativeValue`: `SEC` for seconds, `KGM` for kilograms, `CMT` for centimetres, `P1` for percent.

### Mapping of the completed workout

The completed workout reuses the same tree:

| Completed workout value | Schema.org | Own term |
|---|---|---|
| Completed workout | `ExerciseAction` | |
| Workout ID | `identifier` | |
| Completion | `actionStatus`: `CompletedActionStatus` | |
| Time of the workout | `startTime` or `endTime` | |
| Planned set list | `exercisePlan` | |
| Performed sets | `result`: an `ExercisePlan` tree with the performed values | |
| Skipped set | the set node stays out of `result` | |
| Feedback after the last set | | `feedback` on the exercise node: `TOO_EASY`, `SUCCEEDED`, or `TOO_HARD` |

### Example

A prevention block with one superset of two exercises, 2 sets each. The exercise IDs, names, and values only show the format.

```json
{
  "@context": ["https://schema.org", { "ai": "https://example.com/aiwl#" }],
  "@type": "ExercisePlan",
  "name": [{ "@value": "Schulterprävention", "@language": "de" }, { "@value": "Shoulder prevention", "@language": "en" }],
  "activityDuration": "PT10M",
  "hasPart": [
    {
      "@type": "ExercisePlan",
      "position": 1,
      "identifier": "PREVSHOULDER",
      "exerciseType": "Shoulder prevention",
      "hasPart": [
        {
          "@type": "ExercisePlan",
          "position": 1,
          "additionalType": "ai:Superset",
          "hasPart": [
            {
              "@type": "ExercisePlan",
              "position": 1,
              "identifier": "1201",
              "name": "External rotation with band",
              "hasPart": [
                { "@type": "ExercisePlan", "position": 1, "repetitions": 12, "restPeriods": { "@type": "QuantitativeValue", "value": 30, "unitCode": "SEC" } },
                { "@type": "ExercisePlan", "position": 2, "repetitions": 12, "restPeriods": { "@type": "QuantitativeValue", "value": 30, "unitCode": "SEC" } }
              ]
            },
            {
              "@type": "ExercisePlan",
              "position": 2,
              "identifier": "1207",
              "name": "Prone Y raise",
              "hasPart": [
                { "@type": "ExercisePlan", "position": 1, "repetitions": 10, "ai:load": { "@type": "QuantitativeValue", "value": 2, "unitCode": "KGM" }, "restPeriods": { "@type": "QuantitativeValue", "value": 30, "unitCode": "SEC" } },
                { "@type": "ExercisePlan", "position": 2, "repetitions": 10, "ai:load": { "@type": "QuantitativeValue", "value": 2, "unitCode": "KGM" }, "restPeriods": { "@type": "QuantitativeValue", "value": 60, "unitCode": "SEC" } }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

The set nodes list the sets per exercise. The athlete alternates between the two exercises of the superset in set order, as the set list does today.

## Pros and cons

- Pro: schema.org is the most widely read open vocabulary, maintained outside this project.
- Pro: the planned set list and the completed workout share one tree.
- Pro: a consumer that knows only schema.org reads exercises, order, sets, repetitions, durations, and rests.
- Con: weight, height, side, and feedback need own terms, which only our converters understand.
- Con: schema.org describes `restPeriods` as "how often one should break from the activity". Using it for the rest length in seconds stretches that definition.
- Con: the tree repeats `@type` and `position` on every node and grows large for a long session.

## Open questions

- **Vocabulary URL.** The own terms need a stable URL that the project controls, in place of `https://example.com/aiwl#`.
- **Rest property.** Keep `restPeriods` for the rest length, or move the rest into an own `rest` term and leave `restPeriods` empty.
- **Superset order.** The tree lists sets per exercise. The alternating order of a superset follows from `additionalType`. A consumer that ignores the own vocabulary sees two exercises in a row.
- **Time of the workout.** Check whether the stored timestamp marks the start or the end of the workout, to choose between `startTime` and `endTime`.
- **Language of names.** Schema.org takes one `name` per language through JSON-LD language values. Decide whether the export carries both languages or only the athlete's.
- **Muscles.** Decide whether the export carries `associatedAnatomy`, and which anatomy names it uses.
- **Privacy.** The athlete as `agent` of the `ExerciseAction` would identify a person. The export leaves `agent` out unless a later decision adds it.

## More information

ADRs: [Athletic Intelligence Workout Language](./athletic-intelligence-workout-language.md), [Skill catalog](./skill-catalog.md). Specs: [Glossary](../specs/glossary.md).

Sources:

- [schema.org/ExercisePlan](https://schema.org/ExercisePlan), [schema.org/ExerciseAction](https://schema.org/ExerciseAction), [schema.org/PhysicalActivity](https://schema.org/PhysicalActivity)
- [IEEE 1752.1-2021](https://standards.ieee.org/ieee/1752.1/6982/), [Open mHealth physical activity schema](https://www.openmhealth.org/schemas/omh_physical-activity/)