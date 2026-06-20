# Super Caveman Wrapper Guidance Update Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `super-caveman` and the remaining wrapper skills so their guidance routes additional downstream skill calls through `super-caveman-*` skills consistently while preserving the wrapped base-skill invocation in rule 1.

**Architecture:** Treat this as a suite-wide documentation normalization pass in the workspace source tree. Update the entry skill `super-caveman/SKILL.md`, then apply one equal guidance change across every remaining wrapper skill so the suite expresses downstream `super-caveman-*` routing consistently. Keep this separate from the standalone-content rewrite for `super-caveman-brainstorming`.

**Tech Stack:** Markdown skill docs, shell verification (`rg`, `git diff`, `find`)

## Global Constraints

- Follow `docs/superpowers/specs/2026-06-19-super-caveman-design.md`.
- Preserve the wrapped base-skill invocation in rule 1 of each wrapper.
- Route any additional downstream skill invocation through `super-caveman-*` skills.
- Keep wrapper semantics intact; this is guidance normalization, not behavior expansion.
- Do not fold the standalone `super-caveman-brainstorming` rewrite into this plan.
- Keep `super-caveman-brainstorming` out of the wrapper-set edits; it has its own standalone plan.
- Modify the remaining wrapper skill files equally.

---

### Task 1: Update The Entry Skill Routing Language

**Files:**
- Modify: `super-caveman/SKILL.md`
- Test: `rg`, `sed`

**Interfaces:**
- Consumes: suite routing rule from `docs/superpowers/specs/2026-06-19-super-caveman-design.md`
- Produces: an entry skill that routes into the `super-caveman-*` suite explicitly

- [x] **Step 1: Replace base-skill routing examples with `super-caveman-*` names**

Update at least these lines:

```md
If about to enter plan mode and have not already brainstormed, invoke `super-caveman-brainstorming` first.

## Skill Priority

Use process skills first. They decide how to work.
- Examples: `super-caveman-brainstorming`, `super-caveman-systematic-debugging`
```

Keep the rest of the file structurally close to the current source.

- [x] **Step 2: Verify the entry skill no longer routes to base process skills**

Run:

```bash
rg -n '`brainstorming`|`systematic-debugging`|`writing-plans`|`test-driven-development`' \
  super-caveman/SKILL.md
```

Expected: no matches that indicate base-skill routing examples remain.

- [x] **Step 3: Commit the entry-skill routing update**

```bash
git add super-caveman/SKILL.md \
        docs/superpowers/plans/2026-06-20-super-caveman-wrapper-guidance-update.md
git commit -m "docs: tighten super caveman routing"
```

### Task 2: Normalize Remaining Wrapper Invocation Targets

**Files:**
- Modify: `super-caveman-dispatching-parallel-agents/SKILL.md`
- Modify: `super-caveman-executing-plans/SKILL.md`
- Modify: `super-caveman-finishing-a-development-branch/SKILL.md`
- Modify: `super-caveman-receiving-code-review/SKILL.md`
- Modify: `super-caveman-requesting-code-review/SKILL.md`
- Modify: `super-caveman-subagent-driven-development/SKILL.md`
- Modify: `super-caveman-systematic-debugging/SKILL.md`
- Modify: `super-caveman-test-driven-development/SKILL.md`
- Modify: `super-caveman-using-git-worktrees/SKILL.md`
- Modify: `super-caveman-verification-before-completion/SKILL.md`
- Modify: `super-caveman-writing-plans/SKILL.md`
- Test: `rg`

**Interfaces:**
- Consumes: the current wrapper pattern plus the suite-level routing rule
- Produces: wrapper docs whose guidance is aligned with `super-caveman-*` routing language

- [x] **Step 1: Add one equal downstream-routing rule to every remaining wrapper**

Run:

```bash
for f in super-caveman-*/SKILL.md; do
  echo "--- $f"
  rg -n '`brainstorming`|`writing-plans`|`systematic-debugging`|`test-driven-development`|`verification-before-completion`|`using-git-worktrees`|`executing-plans`|`subagent-driven-development`|`dispatching-parallel-agents`|`requesting-code-review`|`receiving-code-review`|`finishing-a-development-branch`' "$f"
done
```

Expected: a current snapshot of each wrapper before the equal edit.

- [x] **Step 2: Add the same suite-local routing rule to every wrapper**

Add one identical rule to each wrapper body:

```md
5. For any additional skill this workflow invokes beyond rule 1, use the matching `super-caveman-*` variant.
6. When <workflow> ends, this wrapper ends too.
```

Use this replacement pattern:

```md
5. For any additional skill this workflow invokes beyond rule 1, use the matching `super-caveman-*` variant.
6. When <workflow> ends, this wrapper ends too.
```

Keep each wrapper otherwise unchanged. Do not rewrite a wrapper into a standalone skill here.

- [x] **Step 3: Verify the equal wrapper edit landed everywhere**

Run:

```bash
for f in super-caveman-*/SKILL.md; do
  echo "--- $f"
  rg -n '`brainstorming`|`writing-plans`|`systematic-debugging`|`test-driven-development`|`verification-before-completion`|`using-git-worktrees`|`executing-plans`|`subagent-driven-development`|`dispatching-parallel-agents`|`requesting-code-review`|`receiving-code-review`|`finishing-a-development-branch`' "$f"
done
```

Expected: each wrapper contains the new identical downstream-routing rule and its old final line is renumbered.

- [x] **Step 4: Commit the wrapper-guidance normalization**

```bash
git add super-caveman/SKILL.md \
        super-caveman-dispatching-parallel-agents/SKILL.md \
        super-caveman-executing-plans/SKILL.md \
        super-caveman-finishing-a-development-branch/SKILL.md \
        super-caveman-receiving-code-review/SKILL.md \
        super-caveman-requesting-code-review/SKILL.md \
        super-caveman-subagent-driven-development/SKILL.md \
        super-caveman-systematic-debugging/SKILL.md \
        super-caveman-test-driven-development/SKILL.md \
        super-caveman-using-git-worktrees/SKILL.md \
        super-caveman-verification-before-completion/SKILL.md \
        super-caveman-writing-plans/SKILL.md \
        docs/superpowers/plans/2026-06-20-super-caveman-wrapper-guidance-update.md
git commit -m "docs: normalize super caveman wrappers"
```

## Self-Review

- Spec coverage: suite entry-skill routing and wrapper guidance normalization are both covered.
- Placeholder scan: no `TODO`, `TBD`, or “same as above” gaps remain.
- Consistency: all suite-local routing language should use `super-caveman-*`.

## Execution Status

Execution completed in the current session: the wrapper changes were implemented, verified, reviewed against the suite spec, and committed with this plan file.
