---
title: Super Caveman Skill Suite Design
date: 2026-06-19
status: approved-in-conversation
---

# Super Caveman Skill Suite Design

## Goal

Create a parallel caveman-flavored layer for the superpowers skill suite that preserves the same workflow coverage and hard process gates while reducing token usage. The suite should keep the existing superpowers workflows as the source of truth for now, while adding caveman defaults and compressed trigger surfaces.

## Non-Goals

- Rewriting every downstream skill in full during this first pass
- Relaxing the discipline of skill-first execution, approval gates, review rigor, or verification
- Changing safety behavior where compressed language could create ambiguity
- Replacing downstream superpowers workflows with fully autonomous super-caveman equivalents in this phase

## Design Summary

`super-caveman` is the new entry skill. It is a close compression of the original entry-skill behavior with caveman defaults layered on top, not a reordered or reimagined control document. The suite preserves one-to-one workflow coverage with the superpowers process skills, but the downstream skills are wrappers for now, not independent rewrites.

The suite saves tokens in three ways:

1. Default communication uses caveman compression while still stating what the agent is doing and why.
2. Delegation prefers cavecrew subagents so returned context is compressed before it is injected back into the main thread.
3. Wrapper descriptions and bodies are compressed while preserving the original workflow triggers and hard gates.

## Architecture

### Entry Skill

`super-caveman` is the only skill the user should invoke directly at the start of a workflow. It is responsible for:

- enforcing skill-first behavior before any action or response
- making caveman the default communication mode for the main thread
- preserving the original hard process lines in compressed form
- keeping the original instruction order and section structure as closely as practical
- removing redundancy rather than introducing new policy sections
- honoring explicit user instructions that disable caveman in the main thread or subagents
- keeping a compressed skill-access section that preserves the original "load the skill first" behavior without explicit tool-name mapping

The entry skill should stay structurally close to the original `using-superpowers` skill:

- same overall workflow and priority rules
- same hard-line stance on invoking skills before action
- same basic section ordering unless a change is needed for correctness
- no custom policy sections that materially expand scope beyond caveman defaults and compression
- keep the skill-access section, but compress it to generic runtime guidance
- omit explicit per-runtime or tool-name mapping details from that section

### Replacement Skills

Each downstream process skill gets a `super-caveman-*` counterpart. These skills are wrapper routing targets for the new suite. The current version of each wrapper:

- preserves the original workflow intent and hard gates
- keeps trigger semantics aligned with the wrapped skill's description
- compresses wording only where semantics stay intact
- adds a caveman / terse-output preference bias to the description
- delegates to the wrapped skill through a shared body template
- applies caveman mode to main-thread and spawned-subagent behavior unless the user says otherwise

In the current design, downstream wrappers may reference the wrapped superpowers skill by name in the body. Descriptions should not mention replacement status or the wrapped skill name.

When a `super-caveman` skill references or routes to another skill, it should route through the matching `super-caveman-*` variant. Base-skill references are allowed only when the text is describing source provenance rather than invocation.

## Workflow Rules

`super-caveman` must preserve the hard lines of the superpowers approach:

- applicable skills must be checked before any action
- if a skill might apply, it must be invoked
- process skills must be invoked before execution skills
- process skills still determine how work is approached
- cross-skill routing should stay inside the `super-caveman` suite
- approval gates remain in place before implementation
- full-document review remains the default where the original workflow requires it
- verification remains mandatory before claiming success

Token savings should come from wording, routing, and delegation, not from skipping process.

### Communication Contract

The suite should continue to state what it is doing and why, but in compressed caveman form. Short status updates are desirable because they preserve transparency without paying for verbose narration.

The communication contract is:

- terse by default
- explicit about current action and reason
- relies on the existing `caveman` skill contract for safety-critical or ambiguity-sensitive passages
- normal style for code, commands, commit messages, and exact error text where compression would degrade precision

### Caveman Override

`super-caveman` treats caveman as the default, but user style instructions win.

- If the user says to stop caveman or use normal mode, the main thread must stop using caveman.
- If the user says not to pass caveman to subagents, downstream skills must dispatch subagents with explicit non-caveman instructions.
- If the user wants caveman only in the main thread, the main thread stays compressed while subagents stay normal.
- If the user changes caveman intensity, the new intensity persists until changed again.

### Delegation Contract

`super-caveman` establishes caveman as the default for the main thread. Downstream wrappers reinforce caveman behavior while the wrapped workflow is active and own any workflow-specific subagent guidance.

## Initial Replacement Coverage

The first version should create these skills:

- `super-caveman`
- `super-caveman-brainstorming`
- `super-caveman-writing-plans`
- `super-caveman-systematic-debugging`
- `super-caveman-test-driven-development`
- `super-caveman-verification-before-completion`
- `super-caveman-requesting-code-review`
- `super-caveman-receiving-code-review`
- `super-caveman-subagent-driven-development`
- `super-caveman-dispatching-parallel-agents`
- `super-caveman-executing-plans`
- `super-caveman-finishing-a-development-branch`
- `super-caveman-using-git-worktrees`

This list is the initial wrapper path for the most important process skills. Additional wrappers can be added later without changing the routing model.

## Skill Format

### Entry Skill Format

`super-caveman` should remain a compressed derivative of the original entry skill, not a fresh spec written from scratch.

Required content:

- accurate frontmatter `name` and `description`
- the original entry-skill workflow and priority rules, kept in the same general order
- caveman-default guidance for the main thread
- redundancy removed without changing the meaning of the original rules
- a compressed skill-access section that preserves generic skill-loading guidance
- explicit per-runtime or tool-name mapping details omitted
- no extra standalone policy sections that are not needed to express caveman defaults or compression

### Wrapper Skill Format

Each wrapper skill should stay small and consistent.

Required content:

- accurate frontmatter `name` and `description`
- description that preserves the wrapped skill's trigger semantics, with only safe compression
- caveman / terse-output preference added to the description
- no description reference to replacement status or the wrapped skill name
- shared body template that:
    - invokes the wrapped skill and follows it completely
    - forbids replacing, summarizing, or weakening the wrapped skill
    - applies caveman mode during the wrapped workflow for main thread and spawned subagents unless the user says otherwise
    - ends when the wrapped workflow ends
- when another downstream skill is invoked, use the `super-caveman-*` variant

The wrappers are routing surfaces for the new suite. For this phase, they are explicitly wrappers, not standalone replacements.

## Migration Plan

Migration happens one skill at a time.

1. Keep `super-caveman` autonomous immediately.
2. Keep `super-caveman` structurally close to the original entry skill while adding caveman defaults and removing redundancy.
3. Keep downstream `super-caveman-*` skills as thin wrappers for now.
4. Normalize wrapper descriptions so they preserve trigger parity while adding caveman bias.
5. Normalize wrapper bodies around a shared delegate template.
6. Route internally through `super-caveman-*` skills.
7. Rewrite each wrapper into a full replacement later without changing its public name.
8. Remove dependency on original superpowers skill content as each replacement reaches parity.

This keeps the routing model stable while allowing incremental replacement work.

## Verification For This Phase

The first implementation phase should verify:

- the spec file exists in the expected documentation path
- the `super-caveman` entry skill exists
- each initial wrapper skill exists
- naming is consistent across the suite
- `super-caveman` preserves hard-line decision policy in compressed form
- `super-caveman` stays structurally close to the original entry skill without unnecessary new sections or reordering
- caveman override behavior is explicit for the main thread
- each wrapper description preserves the wrapped skill's trigger semantics
- each wrapper description adds caveman / terse-output bias without mentioning replacement status
- each wrapper body uses the shared delegate template consistently

Behavioral parity with every downstream workflow is provided by delegation in the first implementation pass. The requirement for this phase is a correct wrapper skeleton with clear routing, description parity, and token-saving defaults.

## Risks And Constraints

- If compressed wording becomes too implicit, the suite may lose the clarity that makes the original superpowers workflow reliable.
- If description compression changes trigger semantics, wrappers might expand or narrow purview relative to the wrapped skill.
- If the compressed decision flow loses the original hard lines, agents may start rationalizing again.
- If wrapper wording drifts away from the shared template, caveman propagation may become inconsistent across workflows.

These risks are controlled by preserving hard gates, keeping the entry skill autonomous, maintaining description parity with the wrapped skills, and using one shared wrapper-body contract across the suite.
