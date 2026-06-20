Use this when dispatching a spec reviewer after the spec file is written, by default under `docs/superpowers/specs/` (user can override).

The reviewer subagent should use `caveman-ultra`.

## Purpose

Check whether the spec is complete, internally consistent, scoped for one implementation plan, and clear enough to prevent planning mistakes.

## Review Standard

Only flag issues that would cause real planning problems:

- placeholders such as `TODO`, `TBD`, or missing sections
- contradictions or conflicting requirements
- ambiguity that could make someone build the wrong thing
- scope that should be split into multiple plans
- obvious over-building not requested by the spec

Do not block on wording polish, stylistic preferences, or uneven detail that does not affect planning.

## Dispatch Template

```text
You are a spec document reviewer. Use caveman-ultra. Verify this spec is ready for implementation planning.

Spec to review: [SPEC_FILE_PATH]

Check:
- completeness
- consistency
- clarity
- scope
- YAGNI

Only flag issues that would create real planning risk.
Return `approved` when the spec is ready. You may include `issues:` with `approved`, but only for `🔵 nit` or `❓ question`. If any `🔴 bug` or `🟡 risk` is present, do not return `approved`. Write `issues:` as bullet list items in the form `- <location>: <emoji> <tier>: <problem>. <planning impact>`, with cavecrew-reviewer severities `🔴 bug`, `🟡 risk`, `🔵 nit`, `❓ question`. Add `advice:` only for suggested solutions or improvements, also as bullet list items; do not use `advice:` for questions or nit-picks. It is optional.
```

## Output Contract

- `approved` means the spec is ready.
- `issues:` may appear with or without `approved`.
- Use cavecrew-reviewer severity markers: `🔴 bug`, `🟡 risk`, `🔵 nit`, `❓ question`.
- Do not pair `approved` with `🔴 bug` or `🟡 risk`.
- `advice:` is optional, non-blocking, and for suggested solutions only.
