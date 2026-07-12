import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  git,
  gitCommit,
  gitDiffCachedQuiet,
  gitHasPathChanges,
  gitOutput,
  gitStatusShort
} from "../lib/git.mjs";

const quiet = { print: false };

test("gitOutput returns stdout without trailing newline", async () => {
  assert.equal((await gitOutput(["--version"], quiet)).startsWith("git version "), true);
});

test("git reports failures without throwing when allowFailure is true", async () => {
  const result = await git(["definitely-not-a-git-command"], { allowFailure: true, ...quiet });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /git:/);
});

test("gitDiffCachedQuiet returns true in empty repository", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "git-helper-"));
  const init = git(["init"], { cwd: dir, ...quiet });
  assert.equal(init instanceof Promise, true);
  await init;
  assert.equal(await gitDiffCachedQuiet(dir, quiet), true);
});

test("gitDiffCachedQuiet throws on unexpected failure", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "git-helper-bad-"));
  await assert.rejects(gitDiffCachedQuiet(dir, quiet), /git diff --cached --quiet failed/);
});

test("gitStatusShort reports untracked path-scoped changes", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "git-helper-status-"));
  await git(["init"], { cwd: dir, ...quiet });
  await writeFile(path.join(dir, "new.txt"), "new\n");
  assert.equal(await gitStatusShort("new.txt", dir, quiet), "?? new.txt");
  assert.equal(await gitHasPathChanges("new.txt", dir, quiet), true);
});

test("gitCommit configures bot identity in isolated repo", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "git-helper-commit-"));
  const isolatedHome = path.join(dir, "home");
  const isolatedConfig = path.join(dir, "global.gitconfig");

  await git(["init"], { cwd: dir, ...quiet });
  await mkdir(isolatedHome, { recursive: true });
  await writeFile(path.join(dir, "new.txt"), "new\n");
  await git(["add", "--all"], { cwd: dir, ...quiet });

  await gitCommit("ci: isolated commit", dir, {
    env: {
      HOME: isolatedHome,
      XDG_CONFIG_HOME: isolatedHome,
      GIT_CONFIG_GLOBAL: isolatedConfig,
      GIT_CONFIG_NOSYSTEM: "1"
    },
    ...quiet
  });

  assert.equal(await gitOutput(["log", "-1", "--format=%an <%ae>"], { cwd: dir, ...quiet }), "github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>");
});
