Browser companion for mockups, diagrams, and visual comparisons during brainstorming.

## Decision Rule

Decide per question, not per session.

- Use the browser when seeing the answer is materially clearer than reading it: mockups, layouts, diagrams, side-by-side visual comparisons, or spatial relationships.
- Use the terminal for requirements, conceptual choices, trade-off lists, technical decisions, and other text-first questions.

A UI topic is not automatically a visual question.

## Start

Start only after the user accepts the companion.

```bash
scripts/start-server.sh --project-dir /path/to/project --open
```

The server returns JSON with `url`, `screen_dir`, `state_dir`, and `port`.

- Save `screen_dir` and `state_dir`.
- Pass `--project-dir` so files persist in `.superpowers/brainstorm/`.
- Share the full `url` as fallback even with `--open`.
- If the runtime reaps background processes between turns, run the server in its foreground/surviving mode for that environment so it stays reachable.
- On restart, use the same `--project-dir` so the server can reuse the session state and reconnect the existing tab.

## Keyed URL Requirement

The returned URL contains a session `key` query parameter. Always share the complete keyed URL. Do not strip the query string. The browser keeps the key after first load, but the initial handoff must include it.

## Same-Port Restart

Before pushing a screen or referring to the URL, confirm the server is alive:

- `state_dir/server-info` must exist.
- `state_dir/server-stopped` must not exist.

If the server is down, restart it with the same `--project-dir`. The server reuses the same port, so the user's open tab reconnects automatically and shows a paused overlay while the server is unavailable.

## Event Loop

1. Confirm the server is alive.
2. Write a new HTML file into `screen_dir`.
3. Tell the user what is on screen, remind them of the URL, and ask them to reply in the terminal.
4. On the next turn, read `state_dir/events` if it exists and combine browser events with terminal feedback.
5. If feedback changes the same question, write a new screen. If the next step is text-only, push a waiting screen.

The server always serves the newest file. Never reuse filenames.

## Screen Writing Rules

- Write content fragments by default. Full documents are only for cases needing full page control.
- Fragments are auto-wrapped by the server, so they are the normal path unless full-page control is required.
- Use semantic filenames like `layout.html` or `layout-v2.html`.
- Use your normal file-creation tool. Do not dump HTML through terminal heredocs.
- Keep browser content style-neutral unless the question itself is about style.

## Waiting-Screen Pattern

When returning to terminal-only discussion, replace the visual with a waiting screen so stale content is not left on display.

```html
<div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
  <p class="subtitle">Continuing in terminal...</p>
</div>
```

## Events

Browser clicks are written to `state_dir/events` as JSON lines. Use them as structured interaction data; terminal feedback remains primary.

## Reliability Notes

- Same port on restart matters because it lets an existing tab reconnect.
- The event loop depends on reading `events` only after the user responds.
- Keep generation style-neutral. Do not inject caveman style rules into browser output unless the user asked for that visual style.

## Reference

- `scripts/frame-template.html`
- `scripts/helper.js`
- `scripts/start-server.sh`
- `scripts/stop-server.sh`
