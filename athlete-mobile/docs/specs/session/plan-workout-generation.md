# Plan Workout Generation

## Why & What

When an athlete starts a workout, the app generates that session's exercise sequence on-device, at that moment. The stored **training plan** is only a skeleton: sections, per-day **skills** with minute budgets, and pre-selected exercise **branches**. The concrete exercises must reflect today's state, which covers reported soreness, the chosen place and its equipment, the athlete's level, and per-branch progress. This spec covers how the generator turns the plan into the ordered **set list** the athlete executes.

## Problem

The plan is authored days or weeks ahead. By start time the athlete may be sore, at another place with different equipment, or on a new level, so pre-selected branches can be unusable and a naive session would prescribe blocked exercises. Ordering is a second gap: nothing sequences a skill's exercises by body region, so the max strength leg lift can land behind the upper-body lifts, where fatigue is already highest.

## Solution

Filter today's pre-selected branches by soreness, equipment, and level, replace the blocked ones from the skill tree, then resolve each branch to the athlete's level. Workouts the athlete starts without a plan run the same filters over a pool drawn straight from the skill trees: [Plan-Independent Workouts](./plan-independent-workouts.md).

Max strength opens with its lower-body main lifts. Every other skill preferably starts with a large muscle group and then rotates body regions as a soft priority. Region changes take precedence over muscle-group size when ordering subsequent exercises or superset pairs.

Selection operates on branches (one exercise progression lane, authored levels 1 to 6); the concrete exercise is resolved last. Within a skill no resolved exercise ID may appear twice; across skills duplicates are accepted, but the same exercise never ends one skill and directly starts the next when another order exists. Random picks are uniform and unseeded; a generated session is persisted, so reopening it never regenerates (see Structure).

## Out of Scope

- Plan creation from the anamnesis, training gaps, and per-skill maximum minutes: [Training Plan Creation](../planning/training-plan-creation-from-anamnesis.md); this spec starts from an existing plan
- On-demand short workouts and the strength test: [Plan-Independent Workouts](./plan-independent-workouts.md)
- Weight, repetition, and duration computation, feedback-based progression, and intensity tables: [Weight Calculation from Strength Tests](../progression/weight-calculation-from-strength-tests.md) and [Standard Exercise Progression](../progression/standard-exercise-progression.md)
- Exercise swapping or skipping after the set list is shown
- The soreness and place selection UI preceding generation
- Persistence of the finished workout
- Future work: a full list of antagonistic muscle groups for the superset rules
- Future work: a workout duration estimate from 5 s per repetition shown before the workout; statistics then show the measured duration

## Algorithm

### Inputs

Athlete profile (level, gender, birthday, pain tags), reported soreness (sore muscles with timestamps), place and its equipment, weekday, the training plan, per-branch progress and per-exercise history, the exercise catalog, and the authored skill trees.

### Building blocks

- **Skill**: the training quality one block of the session trains, for example max strength, hypertrophy, core, warm-up, cardio, prevention. A skill owns its skill tree, its set count, its pause lengths, and its maximum minutes per fitness level. A training day is a list of skills.
- **Slot**: the plan gives every skill of a training day a minute budget. An authored table per skill and fitness level maps that budget to a fixed number of exercise **slots**, in steps of 5 minutes as a rule, for max strength at 30 minutes: legs, push, pull. The tables differ for weighted and bodyweight variants, since weighted work adds warm-up sets. Plan creation picks the table entry by estimated time ([Training Plan Creation](../planning/training-plan-creation-from-anamnesis.md)); session generation counts no seconds. Every slot carries one pre-selected branch; the exercise filling a max strength slot is its **main lift**, the heavy barbell lift that slot's sets are built around. Slots fill independently: a blocked slot takes a replacement from the same skill tree, and a slot that cannot be refilled frees its minutes.
- **Branch to exercise resolution**: per the resolution rule in [Branches, Exercises, and Levels](../foundations/branches-exercises-and-levels.md). A branch counts as blocked only when nothing resolves at or below the athlete's level.
- **Filter chain**: each filter splits the pool into keep and replace. Soreness drops branches whose region matches a sore area, per [Pain, Soreness, and Prevention](../foundations/pain-soreness-and-prevention.md). Equipment drops branches needing gear the place lacks. Level drops branches with no exercise at the athlete's level. Age and gender drop branches tagged for other groups. Goalkeeper-specific exercises drop out unless the athlete's anamnesis position is goalkeeper.
- **Uniqueness**: a resolved exercise ID is used at most once per skill, and a candidate resolving to an exercise the skill already holds drops out of the pool. The rule covers the plan's pre-selected branches too: when two kept branches of a skill resolve to the same exercise, the first keeps it and the second counts as blocked, so step 4 replaces it from the skill tree; if no replacement fits, its slot frees its time. Branches can converge after plan creation through level changes, so this check runs at every session. Duplicates across skills are tolerated, apart from the skill transition rule under Ordering. Deliberate repeats stand: a one-sided exercise appears as a left and right entry, and every exercise repeats across its own sets.
- **Big vs small muscle groups**: the big muscle groups are chest, upper back, latissimus, front thigh (quadriceps), glutes, and rear thigh (hamstrings), with side-specific muscles counting per side. Every other muscle group is small, explicitly including the inner thigh (adductors) and outer thigh (abductors). This one classification drives the superset rules, superset prioritization, and the ordering by muscle-group size below.
- **Superset rules**: superset skills split their branches into big-muscle and small-muscle groups per the classification above. Partners come only from the same skill, and the big-muscle group pairs out first. A one-sided exercise always pairs with its other-side counterpart; otherwise the partner is a both-sided exercise, preferred in this order:
  1. an opposing muscle group per the authored muscle tags (for example quadriceps with glutes),
  2. a big muscle group from a different body region,
  3. a big muscle group from the same region,
  4. a small muscle group from a different region,
  5. a small muscle group from the same region.

  The generator breaks ties within a rank uniformly at random. Excluded as partners:
  - duplicate exercises,
  - the same concrete movement pattern: horizontal push, horizontal pull, vertical push, vertical pull, hip, knee. The general categories lower body, core, side, front, back, and rotation exclude nothing, so two core exercises may pair.
  - the same primary muscle group (two front-shoulder exercises). Front and rear shoulder count as separate primary muscle groups, so a front-shoulder and a rear-shoulder exercise may pair.

  The prevention skill of a planned session skips the movement-pattern and primary-muscle exclusions, since its pool is small and region-limited, but never pairs an exercise with itself. The duplicate exclusion applies to every superset.

  Without a partner the exercise trains alone, no superset, and rests on its skill's single-exercise rest; [Session Set Structure](./session-set-structure.md) carries the per-skill values. Max strength, full-body stability, and cardio never pair with another exercise. A one-sided full-body stability exercise still runs left and right as a superset.
- **Ordering**: three levels, each independent of the order in which slots were filled.
  1. Skills: fixed section order, warm-up first, cool-down last. At each skill transition, the first unit of the next skill must not contain the exercise that ended the previous skill; the generator reorders the next skill's units to avoid it. If no other order exists, the repeat stays.
  2. Exercises inside a skill: Superset pairs are formed first using the existing superset rules. Each exercise or superset pair is then treated as one unit for ordering. Both exercises of a pair contribute their body regions and primary muscles.

   Ordering follows three soft priorities:

  - **Start with large muscles:** The first unit should train at least one large muscle group whenever available. Core muscles count as small muscle groups.
  -  **Rotate body regions:** Subsequent units should minimize overlap with the body regions of the previous unit. Region changes take priority over muscle-group size.
  -  **Prefer large and different muscles:** When region changes are equally suitable, prefer units training large muscle groups, then units avoiding the same primary muscles. Remaining ties are resolved randomly.

   All priorities are soft. If no suitable alternative exists, select the next-best available unit. No exercises or superset pairs are removed due to ordering, and no special-case logic applies.
  
  3. Exercises inside max strength, overriding rule 2: lower-body main lifts before upper-body main lifts, since they move the session's heaviest loads. Rule 2 then orders the lifts within each region. Support exercises stay in the breaks of their own main lift.
- **Weighted vs bodyweight ratio**: the target share of weighted exercises:

  | Athlete and place | Weighted share |
  |---|---|
  | Under 16 (CHILD), any place | 30% |
  | Gym, strength skills ([Glossary](../glossary.md)) | 80% |
  | Gym, every other skill | 60% |
  | Other places with suitable equipment | 50% |
  | Place without dumbbells or barbells | 0% |

  Age beats place: under 16 in the gym stays at 30%. Children may receive every exercise their age tag allows. [Training Plan Creation](../planning/training-plan-creation-from-anamnesis.md) uses the same shares.

  Each skill enforces the share as a quota over its slots, `weighted = ceil(share × slots)` with the rest bodyweight. A slot draws its type at random while both quotas are open, then takes whichever quota remains. The share is a **soft limit**: only exercises surviving the age, level, soreness, and equipment filters count, bodyweight exercises fill any shortfall, and replacing a branch during a session may break the share. Max strength support exercises are exempt and balance their own share per draw.

### Generating the session

```mermaid
flowchart TD
    A[Today's training from current section, by weekday] --> B[Per skill: soreness, equipment, level filters]
    B --> C{Blocked branches?}
    C -- no --> F[Resolve exercise per branch: progress, else fitness level]
    C -- cardio skill --> D[Replace whole skill with steady zone 5 cardio, max 20 min]
    C -- other skill --> E[Draw replacements from skill tree]
    E --> F
    F --> G[Order skills, build supersets, emit set list]
```

1. **Section and day**: apply the training gap rule from [Training Plan Creation](../planning/training-plan-creation-from-anamnesis.md), then take the section with the latest start date not after today.
2. **Training for today**: use the training matching today's weekday; when none matches, the generator falls back to the section's first training. This weekday fallback is the decided model: a session-time focus choice for planned workouts, where the athlete would pick one of the four focus types for a single session, is deliberately not specified and not implemented. The focus types themselves exist: plan creation assigns one per training day. An athlete who wants a different emphasis today starts a focus training instead, one of the plan-independent short workouts ([Plan-Independent Workouts](./plan-independent-workouts.md)).
3. **Filter** each skill's pre-selected branches by soreness, equipment, and level, then by uniqueness: a kept branch resolving to an exercise ID that an earlier kept branch of the skill already holds counts as blocked. Every removed branch records its body region as a replacement request.
4. **Replace** blocked branches per skill:
   - A blocked cardio skill gives way wholesale to steady zone 5 cardio, capped at 20 minutes.
   - Otherwise candidates come from the skill's tree, run through the same filter chain plus age, excluding branch IDs already kept for this skill and branches resolving to an exercise ID already used in it. Prefer candidates matching the blocked region; failing that, the least-used regions, capped at 5 exercises per region (6 for professionals) with a one-sided branch counting twice. The final pick is uniformly random.
   - Prevention and special warm-up skills replace all-or-nothing, and only from their own prevention region: a knee prevention block takes only knee replacements. If any slot cannot be refilled that way, the skill is dropped for this session. Exception: a slot blocked only by uniqueness (a duplicate exercise) that cannot be refilled is dropped alone, and its time goes to the skill's other exercises.
   - A slot that cannot be refilled frees its time. The generator gives that time to the skills that keep the day's focus, up to each skill's maximum minutes ([Training Plan Creation](../planning/training-plan-creation-from-anamnesis.md)), the fixed set count per skill, and the max strength load caps:

     | Day focus | Skills receiving freed time |
     |---|---|
     | PHASE | The section's strength skill: hypertrophy, max strength, or explosive power |
     | CARDIO | Cardio |
     | STABILITY | Full-body stability and leg axis stability |
     | COMBINED | Strength skill and cardio, split 50/50 |

     Freed time buys cardio duration or an extra exercise slot, never extra sets. Time no receiving skill can absorb drops, and the session gets shorter.
5. **Resolve** every remaining branch to its level-matched exercise.
6. **Assemble**: order skills by the fixed section order (warm-up first, cool-down last), build supersets per skill, and emit the set list with sets and pauses per [Session Set Structure](./session-set-structure.md).

   **Support exercises (max strength only)**: the generator draws support-tagged catalog exercises at random into the breaks between main-lift sets, skipping those that target sore areas, need unavailable equipment, hit the muscles the main lift works as primaries, or already appear in this skill. Once the filtered pool runs out the remaining breaks stay empty, as does any break with no suitable candidate. The general weighted ratio does not apply here.

## Structure

- **Exercise catalog**: flat list of exercises with tags (muscle, region, side, equipment, skill, block) and start values.
- **Skill tree**: per skill, a map of branches; each branch holds tags and levels 1 to 6, each referencing one exercise.
- **Training plan**: sections containing per-weekday trainings; a training holds skills, each with a minute budget and pre-selected branch references.
- **Athlete progress**: per-branch current level and per-exercise history, feeding both resolution and start values.
- **Set list**: the output; an ordered list of entries (exercise or pause) with set numbering, consumed by the active training session store that drives the workout UI.

A session is a sequence of skill blocks; each block fills its slots, then orders what it filled, then emits sets. Max strength as the example:

```text
SESSION  ── skill blocks, fixed section order
──────────────────────────────────────────────────────────────────
  [ warm-up ] -> [ max strength ] -> [ core ] -> [ cool-down ]


MAX STRENGTH BLOCK  ── 30 min, 3 slots
──────────────────────────────────────────────────────────────────
SLOTS      slot   pre-selected branch          filled with
           legs   squat | deadlift        ->   deadlift
           push   bench | shoulder press  ->   bench press
           pull   row                     ->   row (replacement)

SEQUENCE   after selection   bench press | deadlift | row
                             incidental, follows how the slots filled
           after ordering    deadlift | bench press | row
                             lower body first, then big muscle

EMISSION   per main lift     warm-up sets, working sets,
                             support exercises inside the breaks
```

Generation runs between the soreness/place selection screens and the workout overview screen. The set list goes into the session store; starting a workout never mutates the plan.

The app persists the generated session (set list, equipment, active exercise index) and it survives a restart, so reopening it never regenerates: a started workout resumes where it left off, and the overview only reads what is stored. The app clears it when the workout finishes, when the athlete runs generation again from the soreness screen, on logout, and when the athlete leaves the pre-workout flow holding a generated but never started session. There is no date-based expiry.

## Open Questions

None.
