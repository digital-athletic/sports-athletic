# ADR: Workout generator architecture

## Context

The workout generator turns a workout description into the set list for one athlete on one day. It reads:

- an [AIWL](./athletic-intelligence-workout-language.md) template
- the athlete profile
- the training place and its equipment
- the muscle soreness marked for the day
- the skill catalog and the skill trees
- the exercise catalog
- the athlete's exercise data

AIWL defines three block kinds: picks, duration and branches. Short workouts use picks blocks, training days use branches blocks, and a trainer workout uses duration blocks. The specs give each kind its own athlete rules and its own way to select branches.

Some rules in the specs span more than one block, for example [duplicate exercises](./duplicate-exercises.md), the skill boundary in [exercise order](./exercise-order.md), and the special warm-up in [Pain, Soreness, and Prevention](../specs/foundations/pain-soreness-and-prevention.md#pain-mappings). Cardio, max strength and the remaining skills each need their own set list builder. The [strength test](../specs/session/plan-independent-workouts.md#strength-test) has no template.

This ADR defines the structure the generator follows. The specs define the rules. This ADR uses the terms of the [Glossary](../specs/glossary.md) and the block kinds of the AIWL ADR.

## Decision drivers

- Every workout source enters the generator through one entry point and leaves it as one set list.
- A new block kind adds one handler and changes no other handler.
- One handler holds the rules of one block kind, and a reader can follow them top to bottom.
- Each part can be tested on its own, with a repeatable random source.
- The code uses plain TypeScript: modules, plain objects and pure functions. Every module stays within the lint limits without suppressions.
- A stored workout references catalog data and holds no copies of it.

## Options

1. One pipeline per workout source, with shared helper functions.
2. A class hierarchy: an abstract block class with one subclass per kind, and a generator object that calls them in template order.
3. A template interpreter that hands each block to a handler for its kind, built from plain functions.

## Outcome

Option 3.

- Option 1 keeps one flow per source, so a rule added to one flow misses the others.
- Option 2 needs a base class and instance state. A discriminated union gives the same dispatch with less code and an exhaustive check.

## Architecture

### Overview

```mermaid
flowchart TD
    template[AIWL template] --> setup
    input[Generation input] --> setup
    setup[Workout setup<br/>input checks, derived inputs, picks workout rules] --> walk[Block walk in template order]
    walk -->|picks| picks[Picks handler]
    walk -->|branches| branches[Branches handler]
    walk -->|duration| duration[Duration handler]
    picks & branches & duration --> finish[Workout finish<br/>rules across blocks]
    finish --> builder{Set list builder by skill}
    builder --> cardio[Cardio] & max[Max strength] & standard[Standard]
```

### Patterns

The stages form a pipeline (Pipeline). Each component names its design pattern in brackets.

```mermaid
block-beta
    columns 2
    interpreter["Template interpreter (Interpreter)"]:2
    block:handlers
        columns 3
        handlersTitle["Block handlers (Strategy)"]:3
        picks["Picks"] branches["Branches"] duration["Duration"]
    end
    block:builders
        columns 3
        buildersTitle["Set list builders (Strategy, Builder)"]:3
        cardio["Cardio"] maxStrength["Max strength"] standard["Standard"]
    end
    block:rules
        columns 3
        rulesTitle["Rule chain (Pipes and Filters)"]:3
        pain["Pain"] soreness["Muscle soreness"] equipment["Equipment"]
        level["Fitness level"] ageGroup["Age group"] gender["Gender"]
    end
    space
    block:context:2
        columns 2
        input["Generation input (Context Object)"] index["Branch lookup index (Lookup index)"]
    end
```

Each layer uses the layers below it:

- The template interpreter calls the block handler for each block kind and the set list builder for each skill.
- The block handlers run the rule chain.
- Every layer reads the generation input.

The diagram places the interpreter on top because its `switch` imports the handlers and builders, so the interpreter depends on them.

Each box in a layer implements the contract the layer title names. The code defines each contract as a TypeScript function type, and each implementation as a plain function or object literal.

### Stages

1. **Workout setup** runs once per workout.
   - It runs the input checks the specs define.
   - It derives the inputs that several blocks share, such as the body regions blocked by soreness and the prevention skills.
   - It applies the picks rules to the union of all picks block pools, as [Plan-Independent Workouts](../specs/session/plan-independent-workouts.md#short-workout) defines them.
2. **Block walk** (Interpreter) visits the blocks in template order. An exhaustive `switch` over the block kind calls the block's handler.
3. **Workout finish** applies the rules that need every block, such as the [exercise order](./exercise-order.md).
4. **Set list building** (Strategy, Builder) picks a builder by skill:
   - The cardio builder follows the [Cardio Training System](../specs/session/cardio-training-system.md#building-the-block).
   - The max strength builder follows [Max Strength Training](../specs/progression/max-strength-progression.md), support exercises included.
   - The standard builder follows [Session Set Structure](../specs/session/session-set-structure.md) and [Standard Exercise Progression](../specs/progression/standard-exercise-progression.md).

The strength test enters through the same entry point. It skips the template stages and uses its own builder.

### Block handlers (Strategy)

A handler is one function. It takes the block, the generation input and the set of used branches, and returns a block result: the resolved exercises, or the reason the block stayed empty. Handlers share library steps:

- the rule chain runner
- the [resolution of a branch](../specs/foundations/branches-exercises-and-levels.md#resolving-the-level-at-workout-start) to the exercise at the athlete's branch level
- the replacement of blocked branches

Resolution runs inside selection, because the specs drop a candidate whose exercise already appears.

| Block kind | Rules | Scope of the used branches |
|---|---|---|
| Picks | [Plan-Independent Workouts](../specs/session/plan-independent-workouts.md#short-workout) | Whole workout |
| Branches | [Plan Workout Generation](../specs/session/plan-workout-generation.md#generating-the-session) | One block, see [duplicate exercises](./duplicate-exercises.md) |
| Duration | The [minutes table](./athletic-intelligence-workout-language.md#minutes-table) of the AIWL ADR | Whole workout |

A training day stores its cardio skill as a branches block. The branches handler applies the cardio rules from [Soreness and blocking](../specs/session/cardio-training-system.md#soreness-and-blocking). This ADR amends AIWL rule 1, so the rule applies to duration blocks only.

### Rule families (Pipes and Filters)

Each rule family is a pure filter. A family takes candidate branches and returns the kept ones, with a reason for every removal. The generator has one family each for these rules:

- pain
- muscle soreness
- equipment
- fitness level
- age group
- gender

Each handler composes its chain from these families in the order its spec defines.

### Generation input (Context Object)

One read-only object holds every input the stages read:

- the athlete profile
- the place and its equipment
- the muscle soreness
- the skill catalog
- the branch lookup index
- the exercise catalog
- the athlete's exercise data
- the random source

Workout setup adds the derived inputs once. No stage changes the object.

### Branch lookup index (Lookup index)

The index maps every branch ID to its branch across all skill trees. Skill tree loading builds it once, and a spec asserts that every branch ID is unique across the trees.

### Stored workouts

A training day stores an AIWL template. Its branches blocks hold branch IDs and durations. The branch lookup index supplies tags, levels and exercises at generation time, so a stored plan follows catalog changes.

### Errors

The generator raises three classes of error:

1. **Input errors** come from workout setup, when an input check fails.
2. **Workout rule errors** come from the picks workout rules, when a rule empties the union pool.
3. **Empty workout** errors come from the block walk, when every block stayed empty. The generator raises the reason of the first empty block in template order.

### Conventions

- **Discriminated unions.** Block kinds, block results and errors are tagged unions, and every `switch` over them is exhaustive.
- **No mutation.** Every stage returns new values and changes neither the template nor the generation input.
- **Random source.** The generation input carries the random function, with `Math.random` as the default, and every component draws through it. Tests pass a fixed sequence. Each component draws in a fixed order.
- **Module layout.** One folder holds the generator, with one module each for:
  - each stage
  - each handler
  - each rule family
  - the shared library steps
  - the generation input

  Each module has its spec next to it. No index file only re-exports other modules.
- **Naming.** Modules and functions use the glossary terms. A function name is a verb plus a full noun.

## Pros and cons

- Pro: every workout source runs through one interpreter, so a rule change reaches every source that uses the block kind.
- Pro: a new block kind adds one handler and one `switch` case.
- Pro: the rules of a block kind read as one ordered chain inside one handler.
- Pro: each handler, each rule family and each stage has its own spec.
- Con: four stages apply rules: workout setup, the handlers, workout finish and the builders. A reader has to know which stage applies a rule.
- Con: the builders, not the block handlers, select support exercises and the strength test exercises.
- Con: a catalog change that removes a branch ID drops that slot from every stored plan.
- Con: the generation input grows with every new input a rule needs.

## More information

- [Athletic Intelligence Workout Language](./athletic-intelligence-workout-language.md)
- [Duplicate exercises in a session](./duplicate-exercises.md)
- [Exercise order inside a skill](./exercise-order.md)
- [Plan Workout Generation](../specs/session/plan-workout-generation.md)
- [Plan-Independent Workouts](../specs/session/plan-independent-workouts.md)
- [Pain, Soreness, and Prevention](../specs/foundations/pain-soreness-and-prevention.md)
