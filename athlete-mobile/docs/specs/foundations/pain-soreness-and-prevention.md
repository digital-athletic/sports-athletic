# Pain, Soreness, and Prevention

## Why & What

Two different health signals steer training. **Pain** is a lasting complaint the athlete reports in the anamnesis; it reshapes the plan permanently by adding **prevention** work. **Soreness** is a same-day report collected right before a workout; it only reshapes today's session. This spec defines both signals, their mappings to prevention skills, and the rules that filter or refuse a session.

## Problem

Three specs already consume pain and soreness: plan creation selects prevention skills by pain, exercise selection filters by soreness, cardio caps its duration. None of them defines either signal. A trainer who asks how long a soreness report lasts, or why hip pain prescribes knee prevention, has to read the generator to find out, and the rules that abort a session outright are scattered the same way.

## Solution

Keep the two signals separate:

- Pain is part of the athlete profile: it selects prevention skills and switches plan creation to the pain variant of its skill priorities. The **blocked regions** it maps to are authored preparation; pain exclusions do not exist today. Pain changes when the athlete answers the anamnesis again.
- Soreness is a timestamped record that expires after 24 hours. Generation reads it once, and it never reaches the plan.

The generator filters before it refuses: a sore region removes candidate branches and the generator replaces them. It refuses a session when the signal makes the whole session unsafe or unbuildable.

## Out of Scope

- The anamnesis and soreness reporting screens
- Branch replacement mechanics once a filter removes a branch: [Plan Workout Generation](../session/plan-workout-generation.md)
- Prevention slot placement and rotation inside a training day: [Training Plan Creation](../planning/training-plan-creation-from-anamnesis.md)
- Injury diagnosis, rehabilitation programming, and any medical claim

## Algorithm

### Pain mappings

The athlete reports pain per joint and side. The mapping ignores the side: the prevention work and the authored blocked region apply to both sides.

| Reported pain | Prevention skill | Blocked region |
|---|---|---|
| Shoulder | Shoulder prevention | SHOULDER |
| Elbow | Wrist prevention | ELBOW |
| Wrist | Wrist prevention | WRIST |
| Spine | Spine prevention | SPINE |
| Hip | Knee prevention | HIP |
| Knee | Knee prevention | KNEE |
| Ankle | Ankle prevention | ANKLE |

A pain tag outside this table is ignored: it selects no prevention skill and blocks no region, so a content change can never prescribe the wrong prevention work unnoticed. Hip pain maps to knee prevention on purpose: hip and knee complaints are strongly related, and the knee prevention skill already covers the HIP and KNEE_HIP region groups, so no separate hip skill tree exists.

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
3. Pain exclusions do not exist: no branch is excluded for a blocked region, in plan creation or in any workout generation. The blocked-region column above and the block tags on exercises (marking particularly high stress on a region) are authored preparation with no consumer today.
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
| Strength test workout, any soreness | Refused |
| Warm-up, special warm-up for speed work, cool-down, mobility, foam roller | Soreness ignored, these skills always run |
| Prevention workouts and focus trainings (the plan-independent short workouts, e.g. leg axis stability) | Soreness ignored, the check was removed by sprint decision on August 10, 2026 |

```mermaid
flowchart TD
    A[Anamnesis pain] --> B[Prevention skills]
    B --> C[Plan: pain variant of skill priorities]
    E[Soreness report, expires after 24 h] --> F{More than one sore area?}
    F -- yes --> G[Abort with soreness error]
    F -- no --> H{Test workout?}
    H -- yes --> G
    H -- no --> I[Drop branches in the sore area, request replacement]
    I --> J[Cardio with lower-body soreness: steady zone 5, max 20 min]
```

## Structure

Pain lives in the athlete's workout profile as tags, where plan creation and every session generation read it, today only to pick prevention skills and the pain variant of the skill priorities. Soreness lives in a separate, short-lived record set on the device that only generation reads. Soreness feeds the same filter chain that also handles equipment, age, gender, and level, so a removed branch takes the ordinary replacement path regardless of which filter removed it. Prevention skills are ordinary skills with their own skill trees; the pain mapping only decides which of them enter a plan.

## Open Questions

None.
