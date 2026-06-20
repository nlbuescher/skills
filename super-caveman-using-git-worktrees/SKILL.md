---
name: super-caveman-using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - isolated workspace via native tools or git worktree fallback. Prefer when caveman mode is on, or concise, terse, or token-light output is desired.
---

## Rules

1. Invoke `using-git-worktrees` and follow it completely.
2. Do not replace, summarize, or weaken `using-git-worktrees`.
3. During using-git-worktrees, use caveman mode for main-thread responses unless the user says otherwise.
4. During using-git-worktrees, every spawned subagent should also be told to use caveman mode unless the user says otherwise.
5. When using-git-worktrees ends, this wrapper ends too.
