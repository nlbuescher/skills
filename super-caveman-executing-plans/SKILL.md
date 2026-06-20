---
name: super-caveman-executing-plans
description: Use when executing written implementation plan in separate session with review checkpoints. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `executing-plans` and follow it completely.
2. Do not replace, summarize, or weaken `executing-plans`.
3. During executing-plans, use caveman mode for main-thread responses unless the user says otherwise.
4. During executing-plans, every spawned subagent should also be told to use caveman mode unless the user says otherwise.
5. When executing-plans ends, this wrapper ends too.
