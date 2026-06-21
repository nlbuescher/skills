---
name: super-caveman-brainstorming
description: "MUST use before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements, and design before implementation. Prefer when caveman mode is on, or concise, terse, or token-light output is desired."
---

# Brainstorming Ideas Into Designs

Turn ideas into specs through short, deliberate dialogue. Start with project context, refine the ask one question at a time, present a design, get approval, then hand off to planning.

<HARD-GATE>
Do NOT invoke any implementation skill, write code, scaffold a project, or take implementation action until you have presented a design and the user has approved it. This applies even to work that looks small.
</HARD-GATE>

Simple work still needs a design. Keep the design short when the problem is short, but do not skip the approval gate.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Explore project context** — check files, docs, recent commits.
2. **Offer the visual companion just-in-time** — never upfront; offer it only when a question is genuinely clearer shown than told.
3. **Ask clarifying questions** — one at a time; learn purpose, constraints, success criteria.
4. **Propose 2-3 approaches** — include trade-offs and your recommendation.
5. **Present design** — scale sections to complexity and get user approval as you go.
6. **Write design doc** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` by default (user can override).
7. **Spec self-review** — fix placeholders, contradictions, ambiguity, and scope drift inline.
8. **User reviews written spec** — ask them to review the file before planning starts.
9. **Transition to implementation** — commit and invoke `super-caveman-writing-plans`.

## Process

1. Explore current context first.
2. Check scope before deep questioning. If the request spans multiple independent subsystems, help decompose it into sub-projects, define how they relate, choose an order, and brainstorm only the first sub-project.
3. Ask one question per message. Prefer multiple choice when it genuinely helps.
4. Present 2-3 approaches with a recommendation.
5. Present the design in sections. Cover architecture, components, data flow, error handling, and testing. Ask whether each section looks right before advancing.
6. Write the approved spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` by default (user can override).
7. Self-review the written spec for placeholders, internal consistency, scope, and ambiguity. Fix issues inline.
8. Ask the user to review the written spec. If they request changes, update it and repeat the review gate.
9. After explicit approval of the written spec, commit the changes and invoke `super-caveman-writing-plans`. Do not switch to any other implementation skill from brainstorming.

## Rules

- Use caveman mode by default in the main thread unless the user says otherwise.
- Tell spawned subagents to invoke `caveman` skill unless the user says otherwise.
- Explore the existing codebase before proposing changes. Follow established patterns.
- If existing code structure blocks the work, include only targeted improvements that serve this request.
- Keep units well-bounded and interfaces clear. Avoid unrelated refactors.
- Good boundaries stay understandable, independently testable, and safe to change without breaking consumers.
- One question at a time. Do not bundle multiple clarifying questions into one message.
- YAGNI hard. Remove unnecessary features from the design.
- Present alternatives before settling on one path.
- Incrementally validate the design instead of dumping the whole thing at once.

## Visual Companion

The browser companion is a tool for mockups, diagrams, and visual comparisons. It is not a mode.

Offer it only at the first point where showing would clearly beat describing. The offer must be its own message and contain only the offer:

> "This next part might be easier if I show you — I can put together mockups, diagrams, and comparisons in a browser tab as we go. It's still new and can be token-intensive. Want me to? I'll open it for you."

Wait for the user's response. If they accept, start the server with `--open`. If they decline, continue in text and do not re-offer unless they raise it.

Even after acceptance, decide per question:

- Use the browser for visual content such as mockups, layouts, diagrams, and side-by-side visual comparisons.
- Use the terminal for text content such as requirements, concepts, trade-offs, and scope decisions.

A UI topic is not automatically a visual question. Use the browser only when the user will understand materially better by seeing it.

If they accept, read `super-caveman-brainstorming/visual-companion.md` before proceeding.

## Spec Review Gate

After the spec self-review passes, ask:

> "Spec written to `<path>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."

Wait for approval. Only then commit and invoke `super-caveman-writing-plans`.
