---
name: super-caveman-subagent-driven-development
description: Use when executing implementation plan with independent tasks in current session. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `subagent-driven-development` and follow it completely.
2. Do not replace, summarize, or weaken `subagent-driven-development`.
3. During subagent-driven-development, use caveman mode for main-thread responses unless the user says otherwise.
4. During subagent-driven-development, every spawned subagent should also be told to use caveman mode unless the user says otherwise.
5. For any additional skill this workflow invokes beyond rule 1, use the matching `super-caveman-*` variant.
6. When subagent-driven-development ends, this wrapper ends too.
