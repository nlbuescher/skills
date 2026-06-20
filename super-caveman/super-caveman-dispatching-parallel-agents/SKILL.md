---
name: super-caveman-dispatching-parallel-agents
description: Use when 2+ independent tasks can run in parallel without shared state or sequential dependencies. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `dispatching-parallel-agents` and follow it completely.
2. Do not replace, summarize, or weaken `dispatching-parallel-agents`.
3. During dispatching-parallel-agents, use caveman mode for main-thread responses unless the user says otherwise.
4. During dispatching-parallel-agents, every spawned subagent should also be told to use caveman mode unless the user says otherwise.
5. For any additional skill this workflow invokes beyond rule 1, use the matching `super-caveman-*` variant.
6. When dispatching-parallel-agents ends, this wrapper ends too.
