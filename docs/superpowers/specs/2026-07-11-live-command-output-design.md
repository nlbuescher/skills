# Live command output

## Goal

Make Node automation show command output while commands run, without making test output noisy.

## Command runner

Create `.github/scripts/lib/command.mjs` with an asynchronous `runCommand(command, args, options)` function. It starts commands with Node's `spawn`, accumulates `stdout` and `stderr`, and resolves with both streams plus the exit status.

`options.print` defaults to `true`. When true, each received stdout or stderr chunk is immediately written to the matching process stream. When false, streams are still captured and returned, but nothing is forwarded. The runner does not defer forwarding until command completion.

Nonzero exits throw unless `allowFailure` is true. Thrown errors retain captured stderr so diagnostics match current behavior. Process startup failures are surfaced as errors.

## Git integration

Refactor `.github/scripts/lib/git.mjs` to delegate every Git invocation to `runCommand`. The Git API becomes asynchronous where required, while retaining existing helpers for output-only calls, staging, commit, push, and expected nonzero status checks.

All Git helpers accept and pass through the command options needed for `cwd`, environment overrides, failure allowance, and `print`. Production entrypoints use the default live output. `syncDependencies` exposes the same print option and sends it through every Git operation, including clone, ref resolution, staging, commit, and push.

## Testing

Add runner tests for both captured return values and immediate-forwarding mode using controlled child processes. Update Git and sync tests to pass `print: false`, preserving quiet test output while continuing to assert behavior. Run all Node tests after implementation.

## Scope

Only external commands route through the runner. Existing filesystem copy, manifest, and marketplace generation behavior remains unchanged.
