---
title: Super Caveman Writing Plans Skill Design
date: 2026-06-20
status: approved-in-conversation
---

# Super Caveman Writing Plans Skill Design

## Goal

Replace the wrapper in `super-caveman-writing-plans` with a real compressed standalone skill that preserves `writing-plans` semantics across the full installed skill folder while adding super-caveman defaults.

## Non-Goals

- Changing the source `writing-plans/` skill files under `~/.agents/`
- Weakening any planning requirement, output contract, self-review check, or execution handoff from `writing-plans`
- Rewriting execute-only helper scripts into prose artifacts
- Expanding `super-caveman-writing-plans` beyond the behavior of the source skill except for suite routing and caveman-default guidance

## Scope

In scope:

- `super-caveman-writing-plans/SKILL.md`
- `super-caveman-writing-plans/plan-document-reviewer-prompt.md`

Out of scope:

- editing installed runtime copies under `~/.agents/`
- unrelated `super-caveman-*` skills except where this skill must reference them by name

## Source Of Truth

Parity is semantic, not textual.

The rewrite target is the installed `writing-plans/` folder as a whole, not just `SKILL.md`. Any directly read companion file in that folder is also source and must be rewritten into the workspace skill folder. Execute-only scripts are the exception: if a script is used by execution rather than read as instructions, it does not need a prose rewrite.

Workspace files are the editable source of truth. Installed runtime copies under `~/.agents/` are reference material only.

## Written Spec Style

This spec and the resulting standalone skill should use `caveman-lite`.

Rules:

- keep file paths, skill names, commands, templates, and output contracts explicit
- compress explanatory prose, not obligations
- merge redundant sections only when every original rule survives clearly
- preserve normal prose where heavy compression would hurt reviewability or behavioral precision

## File Design

### `super-caveman-writing-plans/SKILL.md`

This file becomes a full standalone compressed rewrite, not a wrapper.

Requirements:

- preserve the original `writing-plans` mission, assumptions about the implementer, and announce-at-start requirement
- preserve the default save path for plans
- preserve the original scope-check behavior for specs that span multiple independent subsystems
- merge redundant task-shaping guidance into a tighter section without losing any rule from:
  - file structure
  - task right-sizing
  - bite-sized task granularity
  - reminder rules about exact paths, complete code, exact commands, and expected output
- preserve the required plan header contract
- preserve the required task template contract
- preserve the no-placeholders rules and failure examples
- preserve the full self-review behavior
- preserve the execution handoff behavior and choice structure
- keep explicit caveman-default guidance for main thread and spawned subagents unless the user says otherwise
- compress user-facing output case by case rather than by blanket rule
- route downstream skill references through `super-caveman-*` variants where this skill invokes other skills

Planned section map:

- `Overview`: mission, implementer assumptions, announce-at-start line, save path, scope check
- `Plan Construction`: merged file-structure, decomposition, task-boundary, and step-sizing rules
- `Required Output Format`: mandatory plan header and task template
- `Failure Rules`: merged placeholder bans plus must-include precision rules
- `Self-Review`: same three review passes as source
- `Execution Handoff`: same decision point and two execution options, renamed only where suite routing requires it
- `Rules`: caveman-default guidance plus source-faithful guardrails

### `super-caveman-writing-plans/plan-document-reviewer-prompt.md`

This file should be a sibling compressed rewrite of the source reviewer prompt, not omitted.

Requirements:

- preserve the review purpose: verify completeness, spec match, and task decomposition
- preserve the dispatch timing: after the complete plan is written
- explicitly instruct the reviewer subagent to use caveman mode
- preserve the calibration threshold: only real implementation blockers should fail approval
- preserve the distinction between blocking issues and non-blocking recommendations
- require explicit approval before the rewrite can be considered complete
- compress wording only where meaning and approval threshold stay unchanged

Reviewer responsibilities must still cover:

- completeness
- spec alignment
- task decomposition
- buildability

## Cross-Skill References

Within this skill, references to invoked downstream skills should route through `super-caveman-*` variants.

Required substitutions:

- `subagent-driven-development` -> `super-caveman-subagent-driven-development`
- `executing-plans` -> `super-caveman-executing-plans`

Everything else should stay source-faithful unless an explicit case-by-case decision changes it.

## Parity Rules

Compression is allowed only when it does not change what the agent is required to do, say, save, review, offer, or approve.

Rules:

- preserve every behaviorally meaningful requirement, gate, template, and branch condition from directly read source files
- preserve exact user-facing strings when wording is part of behavior
- review user-facing strings case by case when compression might be safe
- merge sections only when the destination section still makes every source rule easy to find and verify
- prefer source-faithful structure over clever compression when there is doubt

## Verification

Verify:

1. `super-caveman-writing-plans/SKILL.md` exists and is a real standalone body, not the prior wrapper template.
2. `super-caveman-writing-plans/plan-document-reviewer-prompt.md` exists as a rewritten local companion file.
3. Every directly read file in the installed `writing-plans/` folder has a rewritten workspace counterpart, unless it is execute-only.
4. Every requirement in the source `SKILL.md` is preserved either directly or through a documented merge target.
5. Every requirement in the source `plan-document-reviewer-prompt.md` is preserved either directly or through a documented merge target.
6. Caveman-default guidance is explicit for both the main thread and spawned subagents.
7. Downstream routing changes only where intended.
8. Any compressed user-facing output preserves the same required action and choice structure as source.
9. A review subagent compares the rewritten workspace folder against the installed source folder and explicitly approves parity before the rewrite is considered complete.

## Risks

- Over-compression could hide a required planning obligation or weaken a template contract.
- Merging overlapping sections could accidentally drop a low-frequency but important rule.
- Compressing user-facing choice text could subtly change the execution handoff.
- Rewriting only `SKILL.md` would leave the standalone skill semantically incomplete.

These risks are controlled by folder-level parity, case-by-case user-facing string review, and an approval-gated subagent parity review.
