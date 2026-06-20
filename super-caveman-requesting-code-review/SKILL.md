---
name: super-caveman-requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `requesting-code-review` and follow it completely.
2. Do not replace, summarize, or weaken `requesting-code-review`.
3. During requesting-code-review, use caveman mode for main-thread responses unless the user says otherwise.
4. During requesting-code-review, every spawned subagent should also be told to use caveman mode unless the user says otherwise.
5. When requesting-code-review ends, this wrapper ends too.
