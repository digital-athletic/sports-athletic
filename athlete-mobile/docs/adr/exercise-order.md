# ADR: Exercise order inside a skill

## Context

A skill trains several units. A unit is a single exercise or a superset pair. The generator used to order big muscle group units before small ones and to rotate body regions only inside each of the two groups. Core units never count as big muscle groups. With muscle soreness in the upper body, the soreness filter removes all upper body units, so the big group held only leg units and the small group only core units. The athlete then trained six leg units in a row, followed by six core units. With lower body soreness, all big upper body units ran in a row before upper body and core units started to alternate.

## Decision drivers

- Consecutive units train different active muscles, so body regions alternate.
- Demanding work sits early: a skill opens with a big muscle group, and big muscle groups come before small ones inside a body region.
- Every rule is a soft priority. No unit is dropped over ordering.
- The ordering lives in one function, `orderExerciseUnits` in `src/features/training/utils/exerciseOrderUtils.ts`.

## Options

1. Keep the order big muscle groups first, then rotate regions inside each size group.
2. Sort each region by size, then take one unit per region in turn.
3. Pick one unit at a time and apply all priorities, in a fixed order, to each pick.

## Outcome

Option 3. The generator builds the order one pick at a time. Each pick starts with all units of the skill that are not placed yet and narrows them step by step. A step that would leave no unit keeps the units it received, so every step stays a soft priority.

1. **Max strength, lower body first:** max strength keeps only lower body units while any remain. Its lower body main lifts move the heaviest loads of the session.
2. **Skill boundary, opening pick only:** the first unit must not contain the exercise that ended the previous skill.
3. **Body region:** the generator takes the next region in the rotation full body, lower body, upper body, core, and then starts over. Regions without units are skipped. The opening pick starts the rotation at the first region that holds a big muscle group unit, so the skill opens with one. After each pick the rotation continues behind the chosen region. Units without a body region tag stay until no tagged unit is left, so they come last.
4. **Region overlap:** the generator drops units that share a body region with the previous unit.
5. **Size:** inside the chosen region, big muscle group units come before small ones. Big muscle groups are chest, upper back, latissimus, quadriceps, glutes, and hamstrings.
6. **Primary muscles:** the generator drops units that share a primary muscle with the previous unit.
7. **Random:** the generator picks one of the remaining units uniformly at random, so sessions vary.

Both exercises of a superset pair add their body regions, primary muscles, and size to the unit. A pair of an upper body and a lower body exercise therefore counts for both regions.

Precedence follows the step order:

- Max strength lower body first beats the big muscle group opening: a lower body group without a big unit opens with a small one.
- The skill boundary beats the big muscle group opening: when the only big unit ended the previous skill, a small unit opens the skill.
- A unit without a body region tag never opens the skill, even with a big muscle group.
- The region beats size: a small unit of the next region comes before a big unit of the region just trained.
- Size beats primary muscles: a big unit that shares a primary muscle with the previous unit comes before a small unit of the same region.

Examples:

| Situation | Units | Order |
|---|---|---|
| Upper body soreness | 6 big leg units, 6 small core units | legs, core, legs, core, ... |
| Lower body soreness | 3 big and 3 small upper body units, 6 core units | big upper, core, big upper, core, big upper, core, small upper, core, ... |
| Lower body holds only small units | 2 small leg units, 2 big upper body units | upper, legs, upper, legs |
| Max strength | squat, deadlift, calf raise, bench press | squat and deadlift, calf raise, bench press |

Option 1 fails because the size groups split the regions whenever one region holds only big units and the other only small units. Option 2 needs a second rotation next to the region rotation, and its fixed queues cannot avoid the primary muscles of the previous unit.

## Pros and cons

- Pro: regions alternate for every soreness selection.
- Pro: all priorities sit in one loop in a fixed order, so a change to one priority happens in one place.
- Con: under upper body soreness, core units sit between heavy leg units and can tire the trunk before the next leg exercise.
- Con: when only mixed superset pairs remain, two exercises of the same region can still follow each other.

## More information

Specs: Plan Workout Generation. ADRs: Duplicate exercises in a session (skill boundary rule).
