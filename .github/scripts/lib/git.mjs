import { runCommand } from "./command.mjs";

export async function git(args, options = {}) {
  return runCommand("git", args, {
    ...options,
    env: options.env ? { ...process.env, ...options.env } : process.env
  });
}

export async function gitOutput(args, options = {}) {
  return (await git(args, options)).stdout.trimEnd();
}

export async function gitAddAll(cwd = process.cwd(), options = {}) {
  await git(["add", "--all"], { ...options, cwd });
}

export async function gitDiffCachedQuiet(cwd = process.cwd(), options = {}) {
  const result = await git(["diff", "--cached", "--quiet"], { ...options, cwd, allowFailure: true });
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`git diff --cached --quiet failed\n${result.stderr}`);
}

export async function gitCommit(message, cwd = process.cwd(), options = {}) {
  await configureGitIdentity(cwd, options);
  await git(["commit", "-m", message], { ...options, cwd });
}

export async function configureGitIdentity(cwd = process.cwd(), options = {}) {
  await git(["config", "user.name", "github-actions[bot]"], { ...options, cwd });
  await git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"], {
    ...options,
    cwd
  });
}

export async function gitPush(cwd = process.cwd(), options = {}) {
  await git(["push"], { ...options, cwd });
}

export async function gitStatusShort(pathspec, cwd = process.cwd(), options = {}) {
  const args = ["status", "--short"];
  if (pathspec) args.push("--", pathspec);
  return gitOutput(args, { ...options, cwd });
}

export async function gitHasPathChanges(pathspec, cwd = process.cwd(), options = {}) {
  return (await gitStatusShort(pathspec, cwd, options)).length > 0;
}
