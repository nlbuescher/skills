import { spawnSync } from "node:child_process";

export function git(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  const output = {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };

  if (!options.allowFailure && output.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed\n${output.stderr}`);
  }

  return output;
}

export function gitOutput(args, options = {}) {
  return git(args, options).stdout.trimEnd();
}

export function gitAddAll(cwd = process.cwd()) {
  git(["add", "--all"], { cwd });
}

export function gitDiffCachedQuiet(cwd = process.cwd()) {
  return git(["diff", "--cached", "--quiet"], { cwd, allowFailure: true }).status === 0;
}

export function gitCommit(message, cwd = process.cwd()) {
  git(["commit", "-m", message], { cwd });
}

export function gitPush(cwd = process.cwd()) {
  git(["push"], { cwd });
}

export function gitStatusShort(pathspec, cwd = process.cwd()) {
  const args = ["status", "--short"];
  if (pathspec) args.push("--", pathspec);
  return gitOutput(args, { cwd });
}

export function gitHasPathChanges(pathspec, cwd = process.cwd()) {
  return gitStatusShort(pathspec, cwd).length > 0;
}
