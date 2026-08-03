# Pain, Soreness, and Prevention

## Why & What

Two different health signals steer training. **Pain** is a lasting complaint the athlete reports in the anamnesis; it reshapes the plan permanently by adding **prevention** work and excluding exercises that load the affected joint. **Soreness** is a same-day report collected right before a workout; it only reshapes today's session. This spec defines both signals, their mappings to skills and exclusions, and the rules that filter or refuse a session.

## Problem

Three specs already consume pain and soreness: plan creation filters by blocked regions, exercise selection filters by soreness, cardio caps its duration. None of them defines either signal. A trainer who asks how long a soreness report lasts, or why knee pain also blocks hip exercises, has to read the generator to find out, and the rules that abort a session outright are scattered the same way.

## Solution

Keep the two signals separate:

- Pain is part of the athlete profile: it selects prevention skills, marks **blocked regions**, and switches plan creation to the pain variant of its skill priorities. Pain changes when the athlete answers the anamnesis again.
- Soreness is a timestamped record that expires after 24 hours. Generation reads it once, and it never reaches the plan.

The generator filters before it refuses: a sore or painful region removes candidate branches and the generator replaces them. It refuses a session when the signal makes the whole session unsafe or unbuildable.

## Out of Scope

- The anamnesis and soreness reporting screens
- Branch replacement mechanics once a filter removes a branch: [Plan Workout Generation](../session/plan-workout-generation.md)
- Prevention slot placement and rotation inside a training day: [Training Plan Creation](../planning/training-plan-creation-from-anamnesis.md)
- Injury diagnosis, rehabilitation programming, and any medical claim

## Algorithm

### Pain mappings

The athlete reports pain per joint and side. Both mappings ignore the side: the prevention work and the exclusion apply to both sides.

| Reported pain | Prevention skill | Blocked region |
|---|---|---|
| Shoulder | Shoulder prevention | SHOULDER |
| Elbow | Wrist prevention | ELBOW |
| Wrist | Wrist prevention | WRIST |
| Spine | Spine prevention | SPINE |
| Hip | Knee prevention | HIP |
| Knee | Knee prevention | KNEE |
| Ankle | Ankle prevention | ANKLE |

Each prevention skill draws from the region group it covers, which is wider than the single reported joint:

| Prevention skill | Target regions |
|---|---|
| Shoulder | SHOULDER |
| Wrist | WRIST, ELBOW, WRIST_ELBOW |
| Spine | SPINE |
| Knee | KNEE, HIP, KNEE_HIP |
| Ankle | ANKLE |

Effects of any pain at all:

1. Plan creation uses the pain variant of the skill priorities, which injects a prevention slot and a special warm-up into each training day.
2. The derived prevention skills rotate round-robin, at most one per day.
3. Plan creation and every workout generation exclude branches whose exercise carries a blocked-region tag.
4. During a session, the first exercise prescribed as a percentage of maximum load raises a one-time caution alert.

### Soreness lifetime

1. Before generation the athlete marks sore muscles. Each mark carries its timestamp and an expiration 24 hours later.
2. Opening the soreness step drops every expired record, so a stale report never filters a later session.
3. Marks are per muscle. Muscles map to three **areas**: upper body, core, lower body.

### Soreness rules

| Condition | Effect |
|---|---|
| Sore muscles in more than one area | Generation aborts, naming the affected regions |
| Branch region matches the sore area | Branch removed, its region requested for replacement |
| Cardio skill with lower-body soreness | Whole skill replaced by steady regeneration cardio, capped at 20 minutes |
| Short prevention workout whose own target area is sore | Generation aborts for that workout type |
| Strength test workout, any soreness | Refused |
| Warm-up, special warm-up for speed work, cool-down, mobility, foam roller | Soreness ignored, these skills always run |
| Leg axis stability focus | Soreness ignored, since lower-body soreness would block it permanently |

```mermaid
flowchart TD
    A[Anamnesis pain] --> B[Prevention skills + blocked regions]
    B --> C[Plan: pain variant of skill priorities]
    B --> D[Every generation: exclude blocked-region branches]
    E[Soreness report, expires after 24 h] --> F{More than one sore area?}
    F -- yes --> G[Abort with soreness error]
    F -- no --> H{Test workout?}
    H -- yes --> G
    H -- no --> I[Drop branches in the sore area, request replacement]
    I --> J[Cardio with lower-body soreness: steady zone 5, max 20 min]
```

## Structure

Pain lives in the athlete's workout profile as tags, where plan creation and every session generation read it. Soreness lives in a separate, short-lived record set on the device that only generation reads. Both feed the same filter chain that also handles equipment, age, gender, and level, so a removed branch takes the ordinary replacement path regardless of which signal removed it. Prevention skills are ordinary skills with their own skill trees; the pain mapping only decides which of them enter a plan.

## Open Questions

- An unrecognised pain tag falls back to shoulder prevention and a shoulder block. Should the generator ignore an unknown tag instead, so a content change cannot prescribe the wrong prevention work without anyone noticing? Leaning toward ignoring it.
- Pain applies to both sides by design, so one painful knee excludes both-leg and other-leg exercises alike. Should side-specific pain narrow the exclusion to the affected side? Leaning toward keeping the bilateral rule until a physiotherapist reviews it.
- Soreness expires after a flat 24 hours whatever session caused it. Should heavy Maxkraft sessions extend that window? Leaning toward keeping one flat window, since a longer one blocks the next session's whole region.
- Hip pain maps to knee prevention, and the knee prevention skill already covers the HIP and KNEE_HIP region groups. Is a hip-specific skill tree worth authoring, or does that coverage make the mapping intentional? Leaning toward intentional.
