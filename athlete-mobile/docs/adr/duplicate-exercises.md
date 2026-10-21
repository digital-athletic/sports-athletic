# ADR: Duplicate exercises in a session

## Context

A skill holds several branches, and the generator resolves each branch to the exercise at the athlete's branch level. Two branches can lead to the same exercise: some share their entry exercises by design, and others reach the same exercise after a level up or level down. With little equipment at home, the athlete then trained the same exercise for several sets in a row.

## Decision drivers

- No exercise appears twice within one skill, and no exercise runs twice in a row across two skills.
- Intended repeats stay: the left and right side of one exercise, and the sets of one exercise.
- A small equipment pool still yields a session.
- One duplicate costs the athlete at most that one exercise, never the whole skill.

## Options

1. Fix the skill trees so no two branches share an exercise.
2. Check only when the training plan is created.
3. Check when the training plan is created and again at every session.

## Outcome

Option 3. The generator applies five rules:

1. **Training plan creation:** the generator selects the branches that train each skill, one by one from the skill tree, up to a set number per skill. Before each pick, the generator looks up the exercise each candidate branch holds at the athlete's branch level. The generator removes every candidate whose exercise an already picked branch holds. Example: branches A and B both start with the same squat; once the generator picks A, B is no longer a candidate. When only such candidates remain, the skill keeps the branches picked so far and trains fewer than planned.
2. **Session, regular skills:** after the soreness, equipment and level filters, the first branch keeps its exercise. Each later branch with the same exercise counts as blocked, the same as a branch without equipment, and the generator replaces it with another branch of the same skill and region. When no branch fits, the skill trains one exercise less.
3. **Session, prevention and special warm-up:** a blocked branch normally makes these skills replace all their branches or drop the whole skill. A duplicate refills its own slot only, and prevention takes the replacement from its own body region. When no branch fits, only that slot drops.
4. **Superset:** the generator pairs an exercise only with a different exercise. Without a different partner, the exercise runs alone.
5. **Skill boundary:** the next skill opens with a superset or exercise that does not start with the exercise that ended the previous skill. Max strength keeps its lower body exercises first. When no other unit fits, the repeat stays. [Exercise order inside a skill](./exercise-order.md) places this rule among the other ordering rules.

Exceptions:

- Cardio skills skip the session check.
- A prevention or special warm-up that already needs a replacement for soreness, equipment or level skips the duplicate check, and duplicates can remain.
- The same exercise can appear in two skills that do not follow each other.

Option 1 fails because shared entry exercises are intended. Options 1 and 2 both miss branches that reach the same exercise after a level up or level down.

## Pros and cons

- Pro: no exercise repeats within a skill, also after a level up or level down, and the skill trees stay unchanged.
- Con: the check runs twice; the session check catches branches that meet after the plan was created.
- Con: a dropped duplicate shortens the skill.

## More information

Specs: Plan Workout Generation, Training Plan Creation from the Anamnesis Profile.
