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

test("gitOutput returns stdout without trailing newline", () => {
  assert.equal(gitOutput(["--version"]).startsWith("git version "), true);
});

test("git reports failures without throwing when allowFailure is true", () => {
  const result = git(["definitely-not-a-git-command"], { allowFailure: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /git:/);
});

test("gitDiffCachedQuiet returns true in empty repository", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "git-helper-"));
  git(["init"], { cwd: dir });
  assert.equal(gitDiffCachedQuiet(dir), true);
});

test("gitDiffCachedQuiet throws on unexpected failure", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "git-helper-bad-"));
  assert.throws(() => gitDiffCachedQuiet(dir), /git diff --cached --quiet failed/);
});

test("gitStatusShort reports untracked path-scoped changes", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "git-helper-status-"));
  git(["init"], { cwd: dir });
  await writeFile(path.join(dir, "new.txt"), "new\n");
  assert.equal(gitStatusShort("new.txt", dir), "?? new.txt");
  assert.equal(gitHasPathChanges("new.txt", dir), true);
});

test("gitCommit configures bot identity in isolated repo", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "git-helper-commit-"));
  const isolatedHome = path.join(dir, "home");
  const isolatedConfig = path.join(dir, "global.gitconfig");

  git(["init"], { cwd: dir });
  await mkdir(isolatedHome, { recursive: true });
  await writeFile(path.join(dir, "new.txt"), "new\n");
  git(["add", "--all"], { cwd: dir });

  gitCommit("ci: isolated commit", dir, {
    env: {
      HOME: isolatedHome,
      XDG_CONFIG_HOME: isolatedHome,
      GIT_CONFIG_GLOBAL: isolatedConfig,
      GIT_CONFIG_NOSYSTEM: "1"
    }
  });

  assert.equal(gitOutput(["log", "-1", "--format=%an <%ae>"], { cwd: dir }), "github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>");
});
