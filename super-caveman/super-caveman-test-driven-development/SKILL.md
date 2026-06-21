---
name: super-caveman-test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `test-driven-development` and follow it completely.
2. Do not replace, summarize, or weaken `test-driven-development`.
3. During test-driven-development, invoke `caveman` skill for main-thread responses unless the user says otherwise.
4. During test-driven-development, every spawned subagent should also be told to invoke `caveman` skill unless the user says otherwise.
5. For any additional skill this workflow invokes beyond rule 1, use the matching `super-caveman-*` variant.
6. When test-driven-development ends, this wrapper ends too.
