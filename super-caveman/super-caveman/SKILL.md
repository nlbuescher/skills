---
name: super-caveman
description: Use when starting any conversation and any time an agent must decide whether to load a skill before responding or acting.
---

<SUBAGENT-STOP>
If dispatched as subagent for specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

User instructions win. Skills override default system behavior only when user did not say otherwise.

Order:
1. User instructions (`CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, direct requests)
2. Skills
3. Default system prompt

If user instructions conflict with a skill, follow user instructions.

## Accessing Skills

Load current skill instructions before acting.

Use the runtime's normal skill-loading path for the current environment.

## Rule

Invoke `caveman` skill now, unless user explicitly requests otherwise.

Before any response, clarification, exploration, planning, or implementation:
1. Check whether any skill might apply.
2. If yes, invoke it first.
3. If invoked skill turns out not to fit, you do not need to keep using it.
4. Announce which skill you are using and why.
5. If skill has checklist, create one task per item.
6. Follow skill exactly.

If about to enter plan mode and have not already brainstormed, invoke `super-caveman-brainstorming` first.

## Red Flags

These thoughts mean STOP and invoke skills first:

| Thought | Reality |
|---|---|
| "This is just a simple question/task" | Questions and small tasks still need skill check. |
| "I need more context first" | Skill check comes before clarifying questions. |
| "Let me explore/gather/check code/files/git first" | Skill check comes before exploration or information gathering. |
| "This doesn't need a formal skill" / "skill is overkill" | If a skill exists, use it. |
| "I remember this skill" / "I know what that means" | Skills change. Load current version. |
| "This doesn't count as a task" | Any action counts as a task. |
| "I'll just do one thing first" / "this feels productive" | Undisciplined action wastes time. |

## Skill Priority

Use process skills first. They decide how to work.
- Examples: `super-caveman-brainstorming`, `super-caveman-systematic-debugging`

Use implementation skills second. They guide execution.

## Skill Types

Rigid skills: follow exactly. Do not adapt away discipline.

Flexible skills: adapt principles to context.

Skill itself defines which.

## User Instructions

User requests say WHAT to do, not HOW. Do not skip required workflow.
