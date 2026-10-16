# ADR: Duplicate exercises in a session

## Context

A skill holds several branches, and each resolves to the exercise of the athlete's level. Two branches can lead to the same exercise: some share their entry exercises on purpose, and others meet after a level change. With little equipment, the athlete could then train the same exercise several sets in a row.

## Decision drivers

- No accidental repeat of an exercise.
- Deliberate repeats stay: left and right side, and the sets of one exercise.
- A small equipment pool still yields a session.
- One duplicate must not cost the athlete a whole skill.

## Options

1. Fix the data so no two branches share an exercise.
2. Check only when the training plan is created.
3. Check when the plan is created and at every session.

## Outcome

Option 3.

- The plan avoids two branches with the same exercise in one skill.
- Each session replaces a remaining duplicate with another branch of the skill, or drops it when nothing fits.
- In prevention, only the duplicate drops, not the whole skill.
- A superset never pairs an exercise with itself.
- The same exercise does not end one skill and start the next when another order exists.

Option 1 fails because shared entry exercises are intended. Options 1 and 2 both miss branches that meet after a level change.

## Pros and cons

- Pro: no accidental repeats, also after level changes, without changing the skill trees.
- Con: the check runs twice; the second one is needed for branches that meet later.
- Con: a dropped duplicate shortens the skill.

## More information

Specs: Plan Workout Generation, Training Plan Creation from the Anamnesis Profile.
