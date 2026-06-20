---
title: Super Caveman Brainstorming Skill Design
date: 2026-06-20
status: approved-in-conversation
---

# Super Caveman Brainstorming Skill Design

## Goal

Replace the wrapper in `super-caveman-brainstorming` with a real compressed skill that preserves `brainstorming` semantics while using super-caveman defaults and reduced prose.

## Non-Goals

- Changing the source `brainstorming/` skill files
- Editing `brainstorming/scripts/`
- Establishing a general rule that all wrapper skills must be rewritten now
- Weakening approval gates, review gates, or the required handoff to `super-caveman-writing-plans`

## Scope

In scope:

- `super-caveman-brainstorming/SKILL.md`
- `super-caveman-brainstorming/visual-companion.md`
- `super-caveman-brainstorming/spec-document-reviewer-prompt.md`
- unchanged copies of source companion scripts into `super-caveman-brainstorming/scripts/`

Out of scope:

- editing installed runtime copies under `~/.agents/`
- unrelated `super-caveman-*` skills

## Source Of Truth

Parity is semantic, not textual.

The replacement must preserve the workflow, gates, and obligations of the source `brainstorming` skill. Compression is allowed only where it removes redundancy or verbose explanation without changing behavior.

Workspace files are the editable source of truth. Installed runtime copies under `~/.agents/` are reference material only.

## Written Spec Style

This spec and future brainstorming-phase written specs in this super-caveman flow should use `caveman-lite`.

Rules:

- keep file paths, skill names, gates, and output contracts explicit
- prefer compressed prose over verbose prose
- do not compress wording so hard that reviewability drops

## File Design

### `super-caveman-brainstorming/SKILL.md`

This file becomes a full standalone compressed rewrite, not a wrapper.

Requirements:

- preserve the `brainstorming` hard gate against implementation before approved design
- keep the checklist order unchanged
- compress checklist item text only
- replace the original flowchart with a compressed ordered list
- collapse long explanatory sections into fewer rule sections where possible
- preserve every original obligation:
  - context exploration
  - scope/decomposition check
  - clarifying questions
  - 2-3 approaches with recommendation
  - design presentation with user approval
  - spec writing
  - spec self-review
  - user review gate
  - transition to `super-caveman-writing-plans`
- keep explicit caveman-default guidance for main thread and spawned subagents unless user says otherwise
- always route cross-skill references through `super-caveman-*` skills

### `super-caveman-brainstorming/visual-companion.md`

This file should be a sibling compressed copy of the source companion guide.

Requirements:

- stay style-neutral
- compress by removing repetition, not by changing behavior
- preserve all reliability-critical instructions:
  - visual vs terminal decision rule
  - start and restart behavior
  - keyed URL requirement
  - same-port reconnect behavior
  - event-file loop
  - waiting-screen pattern

### `super-caveman-brainstorming/scripts/`

The new skill folder should include a `scripts/` directory copied from `brainstorming/scripts/`.

Requirements:

- copy all script files unchanged
- do not compress, rewrite, or otherwise edit script contents
- keep filenames and relative paths intact so companion-doc references remain local to the new skill folder
- treat script copying as packaging/self-containment work, not behavior change

### `super-caveman-brainstorming/spec-document-reviewer-prompt.md`

This file should be a sibling compressed copy of the source reviewer prompt.

Requirements:

- keep review semantics unchanged
- write the prompt in clear normal prose
- explicitly instruct the reviewer subagent to use `caveman-ultra`
- compress the checks and calibration language without weakening thresholds
- preserve the distinction between blocking issues and advisory suggestions

Required reviewer output contract:

```text
approved
```

`issues:` may appear with or without `approved`, but `approved` must not appear with `🔴 bug` or `🟡 risk`.

Issue items should use:

```text
- <location>: <emoji> <tier>: <problem>. <planning impact>
```

Allowed severity markers:

- `🔴 bug`
- `🟡 risk`
- `🔵 nit`
- `❓ question`

`advice:` is optional, non-blocking, and for suggested solutions or improvements only.

Rules:

- `issues:` with `🔴 bug` or `🟡 risk` means the spec is not approved
- `advice:` must not be used for questions or nit-picks
- no status field

## Cross-Skill References

Within this skill, references to other skills should route through `super-caveman-*` variants. Base-skill references are banned.

Primary expected reference:

- `super-caveman-writing-plans`

## Verification

Verify:

1. `super-caveman-brainstorming/SKILL.md` exists and is a real standalone body, not the prior wrapper template.
2. Checklist order matches the source `brainstorming` skill.
3. Hard gates and review gates are preserved.
4. The flowchart has been replaced by a compressed ordered list with equivalent sequence.
5. `visual-companion.md` exists and preserves operational behavior while removing repetition.
6. `spec-document-reviewer-prompt.md` exists and uses the approved compressed output contract.
7. Cross-skill references always route through `super-caveman-*` names.
8. `super-caveman-brainstorming/scripts/` exists and matches `brainstorming/scripts/` byte-for-byte.
9. `brainstorming/scripts/` remains untouched.

## Risks

- Over-compression could make a required gate easy to miss.
- Rewording could accidentally narrow or expand a checklist item.
- Compressing the reviewer prompt too aggressively could turn advisory guidance into blockers or vice versa.

These risks are controlled by preserving order, keeping gates explicit, and verifying file-by-file parity against the source skill.
