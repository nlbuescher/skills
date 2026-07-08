import { spawnSync } from "node:child_process";

export function git(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env ? { ...process.env, ...options.env } : process.env,
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
  const result = git(["diff", "--cached", "--quiet"], { cwd, allowFailure: true });
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`git diff --cached --quiet failed\n${result.stderr}`);
}

export function gitCommit(message, cwd = process.cwd(), options = {}) {
  configureGitIdentity(cwd, options);
  git(["commit", "-m", message], { cwd, env: options.env });
}

export function configureGitIdentity(cwd = process.cwd(), options = {}) {
  git(["config", "user.name", "github-actions[bot]"], { cwd, env: options.env });
  git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"], {
    cwd,
    env: options.env
  });
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
