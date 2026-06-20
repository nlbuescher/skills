---
name: super-caveman-writing-plans
description: Use when spec or requirements exist for multi-step task, before touching code. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `writing-plans` and follow it completely.
2. Do not replace, summarize, or weaken `writing-plans`.
3. During writing-plans, use caveman mode for main-thread responses unless the user says otherwise.
4. During writing-plans, every spawned subagent should also be told to use caveman mode unless the user says otherwise.
5. For any additional skill this workflow invokes beyond rule 1, use the matching `super-caveman-*` variant.
6. When writing-plans ends, this wrapper ends too.
