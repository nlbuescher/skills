---
name: super-caveman-receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `receiving-code-review` and follow it completely.
2. Do not replace, summarize, or weaken `receiving-code-review`.
3. During receiving-code-review, use caveman mode for main-thread responses unless the user says otherwise.
4. During receiving-code-review, every spawned subagent should also be told to use caveman mode unless the user says otherwise.
5. When receiving-code-review ends, this wrapper ends too.
