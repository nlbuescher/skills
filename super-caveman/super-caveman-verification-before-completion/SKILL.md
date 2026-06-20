---
name: super-caveman-verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `verification-before-completion` and follow it completely.
2. Do not replace, summarize, or weaken `verification-before-completion`.
3. During verification-before-completion, use caveman mode for main-thread responses unless the user says otherwise.
4. During verification-before-completion, every spawned subagent should also be told to use caveman mode unless the user says otherwise.
5. For any additional skill this workflow invokes beyond rule 1, use the matching `super-caveman-*` variant.
6. When verification-before-completion ends, this wrapper ends too.
