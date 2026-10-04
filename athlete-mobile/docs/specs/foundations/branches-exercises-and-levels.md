# Branches, Exercises, and Levels

## Why & What

App content sits in three layers: one **skill tree** per **skill** (the training components a session is built from: warm-up, mobility, stability, hypertrophy, Maxkraft, explosive power, prevention, cardio zones, support work), each tree made of **branches**, each branch an ordered set of **levels** that reference exercises from the flat **exercise catalog** (roughly 1200 entries with tags and value configurations). Plans and workouts reference branches only; the exercise an athlete performs is resolved from the branch at workout start using that athlete's level for it. This spec defines the three layers and the rules that move an athlete up and down levels.

## Problem

An exercise carries no difficulty relative to other exercises, and the usable difficulty differs per athlete and per movement pattern. An exercise reference in a plan therefore fixes difficulty at plan creation, couples every improvement to a plan edit, and keeps one plan structure from serving a beginner and a professional. The system needs a stable identity for "the squat-pattern slot on Tuesday" that survives the athlete moving from an assisted variant to a loaded one.

## Solution

A branch is that stable identity. The plan stores branch references, the athlete's per-branch level is stored separately, and workout generation joins the two. Progression is a one-number update. Levels carry two jobs:

1. **Entry mapping**: an athlete with no progress on a branch enters at the level matching their overall training level (BEGINNER 1, ADVANCED 2, PROFESSIONAL 3). Levels 4 to 6 are headroom earned by training, so entry caps at 3 for every athlete. A training level above PROFESSIONAL would entry-map to level 4, but the mapping is deliberately not prepared in advance; it gets added only when that training level actually ships.
2. **Progression ladder**: performance moves the per-branch level independently of the overall training level, so difficulty adapts per movement pattern instead of globally.

A **level change** must land on a level holding a different exercise, so it always surfaces as a new movement with fresh values. A branch offering no such level in the required direction is **exhausted**, and the system swaps in a comparable branch from the same skill tree (**branch substitution**), the only progression event that edits the plan.

## Out of Scope

- How branches are first selected into plans and workouts: [Training Plan Creation](../planning/training-plan-creation-from-anamnesis.md) and [Plan Workout Generation](../session/plan-workout-generation.md)
- Weight, repetition, and duration values, their start/target tables, feedback-driven value adjustment, and the decision whether a standard exercise has earned `LEVEL_UP`, `LEVEL_DOWN`, or `NO_CHANGE`: [Weight Calculation from Strength Tests](../progression/weight-calculation-from-strength-tests.md) and [Standard Exercise Progression](../progression/standard-exercise-progression.md). This specification applies an already-earned level-change direction inside the branch or through branch substitution.
- Authoring workflow for skill trees and the exercise catalog
- The XP level shown in the profile, which is unrelated to branch levels

## Algorithm

### Entities

- **Skill tree**: the branch pool for one skill, keyed by branch ID. Skills trainable with and without weights have two trees, the weighted one and a bodyweight variant (suffix KG, for Körpergewicht); runtime lookup picks the variant matching the location's equipment. Trees define availability only, all difficulty lives in branch levels.
- **Exercise**: catalog entry with tags such as muscle, region, side, equipment and blocks, plus its value configuration.

  The value configuration contains authored start and target values where applicable. An owning progression specification may define a global override. In particular, hypertrophy repetition/duration uses the global ranges from [Standard Exercise Progression](../progression/standard-exercise-progression.md); exercise-specific load values may still vary by athlete level, gender, age group, or exercise.

  Where exercise-specific values are applicable, they may be differentiated by:

  - training level,
  - gender,
  - age group where age-specific values are authored.

  For the current age model, age-specific exercise values may distinguish U16 from athletes aged 16 and above.

  An exercise also defines one progression mode, for example `advance-by-reps` or `advance-by-duration`, and may define an optional other-side counterpart for one-sided movements.
- **Branch**: belongs to exactly one skill tree; carries the branch tags every selection filter and substitution score reads, plus a map from level number to one exercise. Authored levels run 1 to 6, most branches define 3, and the map may skip numbers. An exercise may appear in several branches (about a quarter do, for example the same lift in a hypertrophy and a Maxkraft branch), and about 80% of branches repeat one exercise across adjacent levels so that every entry level resolves.
- **Athlete branch progress**: a map from branch ID to current level, absent until the first level change on that branch. It persists independently of any plan, so it survives plan regeneration, applies wherever the branch reappears, and outlives substitution of the branch.

### Resolving the level at workout start

Per branch in the session, in this order:

1. **Reconcile** the stored level against the shipped tree.
2. **Decay** the stored level after long inactivity.
3. **Resolve**: use the stored level, otherwise entry-map the overall training level to 1, 2, or 3 and fall back downward to the highest authored level at or below it.

A branch with no resolvable exercise counts as blocked and goes to the workout selection flow for replacement.

**Reconciliation** keeps progress consistent with content updates that move or remove levels:

| **Stored level after the update** | **Action** |
| --- | --- |
| Still authored                                             | Keep                                       |
| Gone, its exercise now on another level of the same branch | Move progress to that level                |
| Gone, no unique match                                      | Fall back to the next lower authored level |

**Decay**: after 12 weeks without a completed session, the stored level drops one step per 12-week pause, skipping levels as a level down does, floored at the athlete's entry level. A branch at that floor decays no further and triggers no substitution.

Both steps persist their result, so each correction happens once. Neither moves the athlete to a different branch; that stays exclusive to substitution.

### Earning a level change

The owning progression specification decides whether a level change is earned. This file does **not** independently derive a level change from raw achieved repetitions, duration, weight, or feedback.

**Standard Exercise Progression** owns the progression outcome for hypertrophy, explosive power, power endurance, stability, and prevention:

- `LEVEL_UP` is emitted only after the applicable final upper boundary has been prescribed, performed, and positively evaluated according to that specification.
- `LEVEL_DOWN` is emitted only after the applicable final lower boundary has been prescribed, performed, and evaluated as `too hard` according to that specification.
- Otherwise the result is `NO_CHANGE`, while any repetition/duration or weight progression remains owned by Standard Exercise Progression.
- For hypertrophy, the global repetition/duration boundaries from Standard Exercise Progression override exercise-specific authored repetition/duration values.
- Warm-up, special warm-up, cool-down, mobility, foam roller, and strength-test exercises do not use this standard progression and do not earn branch-level changes through it.

**Maxkraft** receives its level-change trigger from [Max Strength Training](../progression/max-strength-progression.md).

**Cardio** exercises never change branch levels.

This specification receives the resulting direction (`LEVEL_UP`, `LEVEL_DOWN`, or `NO_CHANGE`) and applies the branch/level or substitution behavior below.

### Applying a level change

```mermaid
flowchart TD
    A[Level up or down earned] --> B[Use the resolved current per-branch level<br/>from stored progress or entry mapping]
    B --> C{Authored level in the earned direction<br/>with a different exercise?}
    C -- yes --> D[Take the nearest valid level<br/>skipping gaps and repeated exercises]
    D --> E[Persist the new per-branch level]
    C -- no --> F{Plan workout?}
    F -- no --> G[No change]
    F -- yes --> H[Score eligible substitute branches<br/>using the target level and substitution rules]
    H --> J{Eligible substitute found?}
    J -- no --> G
    J -- yes --> I[Substitute the branch in the plan<br/>and keep the old branch progress]
```

1. **Within the branch**: the search walks outward from the current level in the earned direction and takes the first level that exists and holds a different exercise, passing over skipped numbers and repeated exercises alike. Every real difficulty step in a branch is used before the branch counts as exhausted. Only the athlete's progress changes; the plan is untouched.
2. **On exhaustion**: plan workouts substitute, all other workout types leave everything unchanged. The candidate pool is the same skill tree (weighted and bodyweight variant when weights are available), scored against the old branch, and the plan's training day is rewritten to the winner.
   - Hard exclusions: the old branch, branches already used in the session, mismatched equipment, age, gender, or prevention region, and a switch from a both-sided to a one-sided movement.
   - Score penalties: no exercise at the target level (falling back at most two levels), different body region, switch from one-sided to both-sided, different movement direction. A different body region is the heaviest single penalty, factor 0.5 against 0.8 per soft mismatch, so the technically closest branch wins.
   - The factors 0.5 and 0.8 are the accepted starting point. They change only if a sports-science review of real substitution rankings (top 3 substitutes for representative branches, with scores and reasons) shows repeated systematic misranking; individual disagreements do not move them.
   - **Validation procedure:** before changing the scoring factors, review approximately 10–15 representative branches using the existing content data. For each case, provide the relevant branch levels and tags plus the algorithm's top three substitute branches with scores and reasons. Use existing data, tests, debug output, or a simple CSV/Excel/Markdown export where possible; no new app interface is required. The sports-science owner reviews the rankings. Factors are adjusted only when repeated systematic misranking is identified.
   - Ties break by uniform random pick. A one-sided to both-sided switch adds a second substitute branch to replace the lost per-side volume.
   - A level down from level 1 runs the same search with target level 1, giving a different movement at entry difficulty.
   - The replaced branch keeps its progress, so the swap can be undone at the athlete's old level. The substitute enters through normal resolution; the old level does not transfer.

### Manual exercise swapping (deferred)

Athletes cannot swap exercises manually, and building this is currently not planned. The agreed design, should it be built later:

- The athlete may pick any eligible exercise from the respective skill tree; there is no restriction to levels near the current one.
- Guidance comes from labels instead: each exercise is labeled relative to the athlete's current level in its branch, for example "easier", "appropriate", "more challenging", "significantly more challenging". Exercises near the current level are listed first, but proximity is never a selection requirement.
- A manual swap changes neither the stored branch progress nor the athlete's training level. Automatic level progression stays exclusive to the progression logic above.
- The hard exclusions keep applying: unavailable equipment, exercises unsuitable for the athlete's age or gender, and every other mandatory filter.

### Example: bodyweight squat lane

Explosive power (Schnellkraft, code SK) has the trees SK and SKKG; training at home without weights uses SKKG. Branch 253 there is the two-legged squat lane, tagged knee movement direction, lower body, both-sided, glutes and quadriceps as complex movers.

| **Level** | **Exercise** |
| ---: | --- |
| 1                 | Kniebeuge (squat), advance-by-reps, start 6, target 8 |
| 2                 | Kniebeuge mit Wadenheben (squat with calf raise)      |
| 4                 | Sprungkniebeuge (jump squat); level 3 is unauthored   |

- **Entry**: a beginner resolves level 1, an advanced athlete level 2, a professional maps to the missing level 3 and falls back to level 2.
- **Level up**: once the target has been prescribed and performed and Standard Exercise Progression emits `LEVEL_UP` after the qualifying feedback, the beginner moves to level 2, the calf raise variant, with fresh resolved start values. From level 2 the search passes the missing level 3 and lands on level 4, the jump squat. The plan keeps referencing branch 253 throughout.
- **Exhaustion**: from level 4 nothing higher is authored, so a plan workout scores the remaining SKKG branches (knee direction and lower body preferred, both-sided required, level 4 or at most two levels lower) and a winner such as a lunge lane takes over that training day. Branch 253 keeps its level 4 record. When Standard Exercise Progression emits `LEVEL_DOWN` at the lower boundary while the athlete is already at level 1, the same substitution search runs at level 1 instead of deriving an additional value reduction in this specification.

## Structure

- Skill trees, branches, and the exercise catalog are bundled static data, read-only at runtime.
- The device-local training plan holds branch references per skill per weekday. Substitution is its only progression-driven mutation.
- A persisted progress store holds branch progress and per-exercise history, including branches no longer in the plan. Generation reads it, resolution corrects it, the post-set completion flow writes it.
- The owning progression specification emits the level-change direction. This specification resolves that direction into one of three outcomes: same-branch level change, branch substitution, or no change, and then persists the resulting branch progress.

```mermaid
erDiagram
    SKILL_TREE ||--|{ BRANCH : contains
    BRANCH ||--|{ LEVEL : "authored levels 1..6"
    LEVEL }o--|| EXERCISE : references
    EXERCISE ||--|| VALUE_CONFIGURATION : has
    TRAINING_PLAN }o--o{ BRANCH : "references by id"
    ATHLETE_PROGRESS }o--o{ BRANCH : "stores current level per branch"
```

Here, **LEVEL** means an authored branch-level slot (1–6), not the athlete's overall training level.
