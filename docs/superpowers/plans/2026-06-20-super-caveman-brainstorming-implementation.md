# Super Caveman Brainstorming Standalone Content Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `super-caveman-brainstorming` with a standalone compressed skill and add local companion docs plus unchanged script copies.

**Architecture:** Build `super-caveman-brainstorming/` as a self-contained derivative of the installed `brainstorming` skill: copy the read-only source companion assets from `~/.agents/skills/brainstorming/` into the workspace folder, rewrite the three workspace text artifacts to match the approved super-caveman spec, and leave script behavior untouched. Keep wrapper-guidance updates out of this plan; those belong to the separate suite-routing plan.

**Tech Stack:** Markdown skill docs, shell verification (`cp`, `cmp`, `rg`, `git diff`)

## Global Constraints

- Preserve semantic parity with the installed source skill at `~/.agents/skills/brainstorming/` for workflow, gates, and obligations.
- `super-caveman-brainstorming/SKILL.md` is no longer a wrapper; base-skill references are banned there.
- Within `super-caveman-brainstorming/`, cross-skill invocation must route through `super-caveman-*` skills and base-skill references are banned.
- `super-caveman-brainstorming/scripts/` must be copied unchanged from `~/.agents/skills/brainstorming/scripts/`.
- `visual-companion.md` stays style-neutral.
- `spec-document-reviewer-prompt.md` should tell the reviewer to use `caveman-ultra`, but the prompt itself should remain clear prose.
- Reviewer output contract must be `approved`, optional `advice:`, or `blockers:` with optional `advice:`.

---

### Task 1: Copy The Source Companion Assets Into The New Skill Folder

**Files:**
- Create: `super-caveman-brainstorming/visual-companion.md`
- Create: `super-caveman-brainstorming/spec-document-reviewer-prompt.md`
- Create: `super-caveman-brainstorming/scripts/frame-template.html`
- Create: `super-caveman-brainstorming/scripts/helper.js`
- Create: `super-caveman-brainstorming/scripts/server.cjs`
- Create: `super-caveman-brainstorming/scripts/start-server.sh`
- Create: `super-caveman-brainstorming/scripts/stop-server.sh`
- Test: `cmp`, `find`, `git diff --no-index`

**Interfaces:**
- Consumes: read-only source files under `~/.agents/skills/brainstorming/`
- Produces: local companion-doc and script paths that later tasks rewrite in place without touching source files

- [ ] **Step 1: Copy the source companion docs and scripts into the new skill folder**

```bash
mkdir -p super-caveman-brainstorming/scripts
cp ~/.agents/skills/brainstorming/visual-companion.md \
   super-caveman-brainstorming/visual-companion.md
cp ~/.agents/skills/brainstorming/spec-document-reviewer-prompt.md \
   super-caveman-brainstorming/spec-document-reviewer-prompt.md
cp ~/.agents/skills/brainstorming/scripts/frame-template.html \
   super-caveman-brainstorming/scripts/frame-template.html
cp ~/.agents/skills/brainstorming/scripts/helper.js \
   super-caveman-brainstorming/scripts/helper.js
cp ~/.agents/skills/brainstorming/scripts/server.cjs \
   super-caveman-brainstorming/scripts/server.cjs
cp ~/.agents/skills/brainstorming/scripts/start-server.sh \
   super-caveman-brainstorming/scripts/start-server.sh
cp ~/.agents/skills/brainstorming/scripts/stop-server.sh \
   super-caveman-brainstorming/scripts/stop-server.sh
```

- [ ] **Step 2: Verify the copied script set exists**

Run:

```bash
find super-caveman-brainstorming -maxdepth 3 -type f | sort
```

Expected: the folder lists `SKILL.md`, both companion docs, and all five copied script files.

- [ ] **Step 3: Verify the scripts are byte-for-byte unchanged**

Run:

```bash
cmp -s ~/.agents/skills/brainstorming/scripts/frame-template.html \
       super-caveman-brainstorming/scripts/frame-template.html
cmp -s ~/.agents/skills/brainstorming/scripts/helper.js \
       super-caveman-brainstorming/scripts/helper.js
cmp -s ~/.agents/skills/brainstorming/scripts/server.cjs \
       super-caveman-brainstorming/scripts/server.cjs
cmp -s ~/.agents/skills/brainstorming/scripts/start-server.sh \
       super-caveman-brainstorming/scripts/start-server.sh
cmp -s ~/.agents/skills/brainstorming/scripts/stop-server.sh \
       super-caveman-brainstorming/scripts/stop-server.sh
echo $?
```

Expected: shell exit status `0` after the comparisons.

- [ ] **Step 4: Commit the self-contained asset copy**

```bash
git add super-caveman-brainstorming \
        docs/superpowers/plans/2026-06-20-super-caveman-brainstorming-implementation.md
git commit -m "chore: scaffold super caveman brainstorming"
```

### Task 2: Rewrite `super-caveman-brainstorming/SKILL.md` Into A Standalone Skill

**Files:**
- Modify: `super-caveman-brainstorming/SKILL.md`
- Test: `rg`, `sed`, `git diff`

**Interfaces:**
- Consumes: the approved requirements in `docs/superpowers/specs/2026-06-20-super-caveman-brainstorming-design.md`
- Produces: a standalone brainstorming skill body that later companion-doc steps can reference locally

- [ ] **Step 1: Replace the wrapper body with the standalone compressed skill**

Write the file so it keeps the current frontmatter but replaces the `## Rules` wrapper with a real skill body that:

- preserves the original hard gate against implementation before approved design
- keeps the checklist in the same order as the source skill
- replaces the DOT flowchart with a compressed ordered list
- collapses verbose prose into fewer rule sections
- routes to `super-caveman-writing-plans`, not `writing-plans`
- bans base-skill references

Use this skeleton as the target shape:

```md
---
name: super-caveman-brainstorming
description: "..."
---

# Brainstorming Ideas Into Designs

<HARD-GATE>
...
</HARD-GATE>

## Checklist

1. ...
2. ...
...

## Process

1. Explore context.
2. Ask / refine.
3. Present 2-3 approaches.
4. Present design, get approval.
5. Write spec.
6. Self-review.
7. User reviews written spec.
8. Invoke `super-caveman-writing-plans`.

## Rules

- ...
```

- [ ] **Step 2: Verify checklist order and local routing**

Run:

```bash
rg -n 'Explore project context|Offer the visual companion|Ask clarifying questions|Propose 2-3 approaches|Present design|Write design doc|Spec self-review|User reviews written spec|super-caveman-writing-plans' \
  super-caveman-brainstorming/SKILL.md
```

Expected: all required workflow checkpoints appear in source-order, and the final transition names `super-caveman-writing-plans`.

- [ ] **Step 3: Verify wrapper/base-skill language is gone**

Run:

```bash
rg -n 'Invoke `brainstorming`|Do not replace|wrapped skill|When brainstorming ends|`writing-plans`|follow it completely' \
  super-caveman-brainstorming/SKILL.md
```

Expected: no matches that indicate the old wrapper contract or base-skill invocation language.

- [ ] **Step 4: Commit the standalone skill rewrite**

```bash
git add super-caveman-brainstorming/SKILL.md \
        docs/superpowers/plans/2026-06-20-super-caveman-brainstorming-implementation.md
git commit -m "feat: rewrite super caveman brainstorming"
```

### Task 3: Compress The Local Companion Documents

**Files:**
- Modify: `super-caveman-brainstorming/visual-companion.md`
- Modify: `super-caveman-brainstorming/spec-document-reviewer-prompt.md`
- Test: `rg`, `diff -u`, `sed`

**Interfaces:**
- Consumes: copied source companion docs from Task 1 and the approved output contract from the spec
- Produces: local compressed reference docs used by the standalone skill

- [ ] **Step 1: Compress `visual-companion.md` without changing behavior**

Rewrite the copied file by removing repetition while preserving:

- visual vs terminal decision rule
- keyed URL requirement
- same-port restart guidance
- event loop and waiting-screen behavior
- style-neutral generation guidance

Keep operational instructions clear. Do not inject caveman style rules into generated browser content.

- [ ] **Step 2: Rewrite `spec-document-reviewer-prompt.md` with the approved reviewer contract**

Update the copied prompt so it:

- uses clear prose instructions
- explicitly says the reviewer subagent should use `caveman-ultra`
- compresses checks and calibration
- returns this contract:

```text
approved
```

or

```text
approved
advice:
- <non-blocking suggestion>
```

or

```text
blockers:
- <section>: <problem>. <planning impact>
advice:
- <non-blocking suggestion>
```

- [ ] **Step 3: Verify the companion docs match the intended behavior**

Run:

```bash
rg -n 'style-neutral|key|same port|restart|events|waiting' \
  super-caveman-brainstorming/visual-companion.md
rg -n 'caveman-ultra|approved|blockers:|advice:' \
  super-caveman-brainstorming/spec-document-reviewer-prompt.md
```

Expected: `visual-companion.md` still contains the operational anchors; the reviewer prompt contains `caveman-ultra` and the compressed output labels.

- [ ] **Step 4: Commit the local companion-doc rewrite**

```bash
git add super-caveman-brainstorming/visual-companion.md \
        super-caveman-brainstorming/spec-document-reviewer-prompt.md \
        docs/superpowers/plans/2026-06-20-super-caveman-brainstorming-implementation.md
git commit -m "docs: add super caveman brainstorming refs"
```

### Task 4: Run Final Standalone-Skill Verification

**Files:**
- Test: `rg`, `git diff`, `find`, `cmp`

**Interfaces:**
- Consumes: outputs from Tasks 1-3
- Produces: a verified self-contained `super-caveman-brainstorming` package
- [ ] **Step 1: Run final package verification**

Run:

```bash
find super-caveman-brainstorming -maxdepth 3 -type f | sort
cmp -s ~/.agents/skills/brainstorming/scripts/frame-template.html \
       super-caveman-brainstorming/scripts/frame-template.html
cmp -s ~/.agents/skills/brainstorming/scripts/helper.js \
       super-caveman-brainstorming/scripts/helper.js
cmp -s ~/.agents/skills/brainstorming/scripts/server.cjs \
       super-caveman-brainstorming/scripts/server.cjs
cmp -s ~/.agents/skills/brainstorming/scripts/start-server.sh \
       super-caveman-brainstorming/scripts/start-server.sh
cmp -s ~/.agents/skills/brainstorming/scripts/stop-server.sh \
       super-caveman-brainstorming/scripts/stop-server.sh
rg -n 'super-caveman-writing-plans|blockers:|approved|caveman-ultra' \
  super-caveman-brainstorming
rg -n 'Invoke `brainstorming`|Do not replace, summarize, or weaken `brainstorming`' \
  super-caveman-brainstorming/SKILL.md
git diff -- super-caveman-brainstorming
```

Expected: the new folder is self-contained, scripts match byte-for-byte, the required routing/output strings are present, banned wrapper/base-skill text is absent, and the diff only shows the intended brainstorming-skill files.

- [ ] **Step 2: Commit the standalone-skill completion**

```bash
git add super-caveman-brainstorming \
        docs/superpowers/plans/2026-06-20-super-caveman-brainstorming-implementation.md
git commit -m "feat: finish super caveman brainstorming"
```

## Self-Review

- Spec coverage: all three brainstorming artifacts and copied scripts are covered by Tasks 1-4. Suite-wide wrapper guidance is intentionally excluded and belongs to the separate routing plan.
- Placeholder scan: no `TODO`, `TBD`, or unresolved “similar to” references remain.
- Type consistency: not applicable in the code-type sense, but file paths, skill names, and output labels are consistent across tasks.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-20-super-caveman-brainstorming-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
