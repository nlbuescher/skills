---
name: super-caveman-systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `systematic-debugging` and follow it completely.
2. Do not replace, summarize, or weaken `systematic-debugging`.
3. During systematic-debugging, use caveman mode for main-thread responses unless the user says otherwise.
4. During systematic-debugging, every spawned subagent should also be told to use caveman mode unless the user says otherwise.
5. For any additional skill this workflow invokes beyond rule 1, use the matching `super-caveman-*` variant.
6. When systematic-debugging ends, this wrapper ends too.
