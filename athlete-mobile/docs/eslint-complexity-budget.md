# ESLint complexity budget

A set of size and complexity rules is enforced as errors, but only for **new and changed code**.
Violations that existed when the rules were introduced are recorded in `eslint-suppressions.json`
and do not fail the build.

## The rules

| Rule | Limit | Notes |
| --- | --- | --- |
| `complexity` | 10 | Branches per function. |
| `max-depth` | 4 | Nested blocks. |
| `max-lines` | 300 | Per file, blank lines and comments excluded. |
| `max-lines-per-function` | 50, or 65 in `.tsx` | The higher `.tsx` budget covers the JSX tree, not extra logic. |
| `max-nested-callbacks` | 3 | |
| `max-params` | 4 | Pass an options object beyond that. |
| `import/no-cycle` | no cycles | Fully enforced: the codebase has none. |

`max-lines`, `max-lines-per-function` and `max-nested-callbacks` are off in specs and e2e tests,
where `describe`/`it` nesting makes them meaningless.

## How the baseline works

`eslint-suppressions.json` stores a count per file per rule. Because it counts rather than
disables, the baseline does not shield a file forever:

- A violation in a new file fails.
- A violation of a **different** rule in a baselined file fails.
- An **additional** violation of an already-baselined rule fails.

## When you hit one of these errors

Fix the code. Split the function, extract a hook, or replace a long parameter list with an
options object. Do not add the violation to the baseline, and do not silence it with an inline
`eslint-disable` comment (also forbidden by `AGENTS.md`).

## When you fix legacy violations

Shrink the baseline so the freed-up count cannot silently absorb a future violation:

```bash
pnpm lint:prune-suppressions
```

This is currently a local step, not enforced by CI. Regenerating the whole baseline
(`eslint . --suppress-all`) is deliberately not a package script: it would let a red build be
made green by re-recording new violations.
