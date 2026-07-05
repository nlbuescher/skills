# Skill Dependency Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build JS-based dependency sync and marketplace generation driven by root `skills.json`.

**Architecture:** Add small focused Node ESM modules under `.github/scripts/lib/`, with CLI entrypoints for sync and marketplace update. Shared git helpers wrap `child_process` once, while tests use Node's built-in `node:test` runner and temporary fixture repos.

**Tech Stack:** Node.js ESM, `node:test`, GitHub Actions composite actions, `act`, Git CLI, `JSON.parse` for `skills.json`, dependency-free flat YAML formatting/parsing for `.upstream.yml`.

## Global Constraints

- `skills.json` is input only and must never be written by sync or marketplace logic.
- `skills.json` declares only external dependencies, not all repo skills.
- `mappings` stay colon-separated strings such as `skills/*:.`.
- Sync deletes each dependency target before copying mapped files.
- `.upstream.yml` includes `source`, `repository`, `ref`, and `commit`.
- Removed dependencies are detected from existing `skills/*/.upstream.yml` whose `source` is absent from `skills.json`.
- Marketplace file `.claude-plugin/marketplace.json` is fully regenerated; no manual entries are preserved.
- Marketplace plugin names come only from immediate category folders under `skills/`.
- Flat skills such as `skills/grill-me/SKILL.md` are omitted from marketplace entries.
- Sync commits use subject `ci: sync dependencies` and body lines `- add <owner/repo> (<ref>)`, `- update <owner/repo> (<ref>)`, or `- remove <owner/repo>`.
- Sync uses `git add --all`.
- Workflow verification uses `act`; failure at `git push` is acceptable after sync and marketplace logic completes.

---

## File Structure

- Create `skills.json`: root dependency manifest replacing workflow hard-coded dependencies.
- Create `.github/scripts/lib/git.mjs`: reusable git wrapper used by sync and marketplace scripts.
- Create `.github/scripts/lib/skills-manifest.mjs`: parse and validate `skills.json`.
- Create `.github/scripts/lib/marketplace.mjs`: scan skills tree and build/write marketplace JSON.
- Create `.github/scripts/lib/sync-dependencies.mjs`: sync engine, removal detection, change classification, commit message building.
- Create `.github/scripts/update-marketplace.mjs`: marketplace-only CLI.
- Create `.github/scripts/sync-dependencies.mjs`: sync CLI.
- Create tests under `.github/scripts/test/*.test.mjs`.
- Modify `.github/actions/sync-dependency/action.yml`: replace per-dependency inputs with one sync CLI call.
- Delete `.github/actions/sync-dependency/sync-dependency.sh`: bash core logic removed.
- Add `.github/actions/update-marketplace/action.yml`: marketplace-only composite action.
- Modify `.github/workflows/sync-dependencies.yml`: call unified sync action and trigger on `skills.json`.
- Add `.github/workflows/update-marketplace.yml`: update marketplace for manual skill/category changes.

## Task 1: Test Harness, Manifest Parser, Git Helper

**Files:**
- Create: `skills.json`
- Create: `.github/scripts/lib/git.mjs`
- Create: `.github/scripts/lib/skills-manifest.mjs`
- Test: `.github/scripts/test/skills-manifest.test.mjs`
- Test: `.github/scripts/test/git.test.mjs`

**Interfaces:**
- Produces: `readSkillsManifest(filePath = "skills.json"): Promise<{ dependencies: Dependency[] }>`
- Produces: `parseMapping(value: string): { source: string, target: string }`
- Produces: `git(args: string[], options?: { cwd?: string, allowFailure?: boolean }): GitResult`
- Produces: `gitOutput(args: string[], options?: { cwd?: string }): string`
- Produces: `gitAddAll(cwd?: string): void`
- Produces: `gitDiffCachedQuiet(cwd?: string): boolean`
- Produces: `gitCommit(message: string, cwd?: string): void`
- Produces: `gitPush(cwd?: string): void`
- Produces: `gitStatusShort(pathspec?: string, cwd?: string): string`
- Produces: `gitHasPathChanges(pathspec: string, cwd?: string): boolean`

- [ ] **Step 1: Write failing manifest tests**

Create `.github/scripts/test/skills-manifest.test.mjs`:

```js
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parseMapping, readSkillsManifest } from "../lib/skills-manifest.mjs";

test("parseMapping preserves colon-separated mapping strings", () => {
  assert.deepEqual(parseMapping("skills/*:."), { source: "skills/*", target: "." });
  assert.deepEqual(parseMapping("agents:cavecrew/agents"), {
    source: "agents",
    target: "cavecrew/agents"
  });
});

test("readSkillsManifest parses dependencies from skills.json", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "skills-manifest-"));
  const file = path.join(dir, "skills.json");
  await writeFile(
    file,
    JSON.stringify({
      dependencies: [
        {
          source: "JuliusBrussee/caveman",
          target: "skills/caveman",
          "use-tags": false,
          mappings: ["skills/*:.", "LICENSE:LICENSE"]
        }
      ]
    })
  );

  const manifest = await readSkillsManifest(file);

  assert.deepEqual(manifest, {
    dependencies: [
      {
        source: "JuliusBrussee/caveman",
        repository: "https://github.com/JuliusBrussee/caveman",
        target: "skills/caveman",
        useTags: false,
        mappings: [
          { source: "skills/*", target: "." },
          { source: "LICENSE", target: "LICENSE" }
        ]
      }
    ]
  });
});
```

- [ ] **Step 2: Run manifest tests to verify failure**

Run: `node --test .github/scripts/test/skills-manifest.test.mjs`

Expected: FAIL with module not found for `../lib/skills-manifest.mjs`.

- [ ] **Step 3: Implement manifest parser**

Create `.github/scripts/lib/skills-manifest.mjs`:

```js
import { readFile } from "node:fs/promises";
export function parseMapping(value) {
  if (typeof value !== "string" || !value.includes(":")) {
    throw new Error(`Invalid mapping: ${value}`);
  }
  const separator = value.indexOf(":");
  return {
    source: value.slice(0, separator),
    target: value.slice(separator + 1)
  };
}

export async function readSkillsManifest(filePath = "skills.json") {
  const raw = await readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  const dependencies = (data.dependencies ?? []).map((dependency) => {
    const source = requiredString(dependency.source, "source");
    return {
      source,
      repository: dependency.repository ?? `https://github.com/${source}`,
      target: requiredString(dependency.target, "target"),
      useTags: dependency["use-tags"] === true || dependency.useTags === true,
      mappings: (dependency.mappings ?? []).map(parseMapping)
    };
  });
  return { dependencies };
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Dependency ${field} must be a non-empty string`);
  }
  return value;
}
```

- [ ] **Step 4: Run manifest tests to verify pass**

Run: `node --test .github/scripts/test/skills-manifest.test.mjs`

Expected: PASS.

- [ ] **Step 5: Write failing git helper tests**

Create `.github/scripts/test/git.test.mjs`:

```js
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { git, gitDiffCachedQuiet, gitHasPathChanges, gitOutput, gitStatusShort } from "../lib/git.mjs";

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

test("gitStatusShort reports untracked path-scoped changes", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "git-helper-status-"));
  git(["init"], { cwd: dir });
  await writeFile(path.join(dir, "new.txt"), "new\n");
  assert.equal(gitStatusShort("new.txt", dir), "?? new.txt");
  assert.equal(gitHasPathChanges("new.txt", dir), true);
});
```

- [ ] **Step 6: Run git helper tests to verify failure**

Run: `node --test .github/scripts/test/git.test.mjs`

Expected: FAIL with module not found for `../lib/git.mjs`.

- [ ] **Step 7: Implement git helper**

Create `.github/scripts/lib/git.mjs`:

```js
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
```

- [ ] **Step 8: Run Task 1 tests to verify pass**

Run: `node --test .github/scripts/test/skills-manifest.test.mjs .github/scripts/test/git.test.mjs`

Expected: PASS.

- [ ] **Step 9: Add root `skills.json`**

Create `skills.json`:

```json
{
  "dependencies": [
    {
      "source": "JuliusBrussee/caveman",
      "target": "skills/caveman",
      "use-tags": false,
      "mappings": [
        "skills/*:.",
        "LICENSE:LICENSE",
        "agents:cavecrew/agents"
      ]
    },
    {
      "source": "obra/superpowers",
      "target": "skills/superpowers",
      "use-tags": false,
      "mappings": [
        "skills/*:.",
        "LICENSE:LICENSE"
      ]
    }
  ]
}
```

- [ ] **Step 10: Commit Task 1**

Run:

```bash
git add skills.json .github/scripts/lib/git.mjs .github/scripts/lib/skills-manifest.mjs .github/scripts/test/skills-manifest.test.mjs .github/scripts/test/git.test.mjs
git commit -m "feat: add skill dependency manifest parser"
```

## Task 2: Marketplace Generator

**Files:**
- Create: `.github/scripts/lib/marketplace.mjs`
- Create: `.github/scripts/update-marketplace.mjs`
- Test: `.github/scripts/test/marketplace.test.mjs`

**Interfaces:**
- Consumes: git helper `gitAddAll`, `gitCommit`, `gitDiffCachedQuiet`, `gitPush`
- Produces: `buildMarketplace(rootDir = process.cwd()): Promise<object>`
- Produces: `writeMarketplaceIfChanged(rootDir = process.cwd()): Promise<boolean>`

- [ ] **Step 1: Write failing marketplace tests**

Create `.github/scripts/test/marketplace.test.mjs`:

```js
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildMarketplace, writeMarketplaceIfChanged } from "../lib/marketplace.mjs";

async function skill(root, relativePath, name) {
  const dir = path.join(root, relativePath);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: test\n---\n`);
}

test("buildMarketplace groups category folders and omits flat skills", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "marketplace-"));
  await skill(root, "skills/productivity/grill-me", "grill-me");
  await skill(root, "skills/productivity/focus", "focus");
  await skill(root, "skills/grill-me", "flat-grill-me");

  const marketplace = await buildMarketplace(root);

  assert.deepEqual(marketplace, {
    metadata: { pluginRoot: "./" },
    plugins: [
      {
        name: "productivity",
        source: "./skills/productivity",
        skills: ["./focus/SKILL.md", "./grill-me/SKILL.md"]
      }
    ]
  });
});

test("writeMarketplaceIfChanged writes only when normalized output changes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "marketplace-write-"));
  await skill(root, "skills/caveman/caveman", "caveman");

  assert.equal(await writeMarketplaceIfChanged(root), true);
  const first = await readFile(path.join(root, ".claude-plugin/marketplace.json"), "utf8");
  assert.equal(await writeMarketplaceIfChanged(root), false);
  const second = await readFile(path.join(root, ".claude-plugin/marketplace.json"), "utf8");
  assert.equal(second, first);
});
```

- [ ] **Step 2: Run marketplace tests to verify failure**

Run: `node --test .github/scripts/test/marketplace.test.mjs`

Expected: FAIL with module not found for `../lib/marketplace.mjs`.

- [ ] **Step 3: Implement marketplace generator**

Create `.github/scripts/lib/marketplace.mjs`:

```js
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function buildMarketplace(rootDir = process.cwd()) {
  const skillsRoot = path.join(rootDir, "skills");
  const plugins = [];
  for (const category of await safeDirNames(skillsRoot)) {
    const categoryDir = path.join(skillsRoot, category);
    const skills = [];
    for (const skillName of await safeDirNames(categoryDir)) {
      const skillFile = path.join(categoryDir, skillName, "SKILL.md");
      if (await exists(skillFile)) {
        skills.push(`./${skillName}/SKILL.md`);
      }
    }
    if (skills.length > 0) {
      plugins.push({
        name: category,
        source: `./skills/${category}`,
        skills: skills.sort()
      });
    }
  }
  return {
    metadata: { pluginRoot: "./" },
    plugins: plugins.sort((a, b) => a.name.localeCompare(b.name))
  };
}

export async function writeMarketplaceIfChanged(rootDir = process.cwd()) {
  const marketplace = await buildMarketplace(rootDir);
  const output = `${JSON.stringify(marketplace, null, 2)}\n`;
  const file = path.join(rootDir, ".claude-plugin", "marketplace.json");
  const current = await readTextIfExists(file);
  if (current === output) return false;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, output);
  return true;
}

async function safeDirNames(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function exists(file) {
  try {
    await readFile(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function readTextIfExists(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}
```

- [ ] **Step 4: Implement marketplace CLI**

Create `.github/scripts/update-marketplace.mjs`:

```js
#!/usr/bin/env node
import { writeMarketplaceIfChanged } from "./lib/marketplace.mjs";
import { gitAddAll, gitCommit, gitDiffCachedQuiet, gitPush } from "./lib/git.mjs";

const changed = await writeMarketplaceIfChanged(process.cwd());
if (!changed) {
  console.log("Marketplace already current.");
  process.exit(0);
}

gitAddAll();
if (gitDiffCachedQuiet()) {
  console.log("No marketplace changes to commit.");
  process.exit(0);
}

gitCommit("ci: update marketplace");
gitPush();
```

- [ ] **Step 5: Run marketplace tests to verify pass**

Run: `node --test .github/scripts/test/marketplace.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add .github/scripts/lib/marketplace.mjs .github/scripts/update-marketplace.mjs .github/scripts/test/marketplace.test.mjs
git commit -m "feat: generate claude plugin marketplace"
```

## Task 3: Sync Engine and Commit Message

**Files:**
- Create: `.github/scripts/lib/sync-dependencies.mjs`
- Create: `.github/scripts/sync-dependencies.mjs`
- Test: `.github/scripts/test/sync-dependencies.test.mjs`

**Interfaces:**
- Consumes: `readSkillsManifest`, `writeMarketplaceIfChanged`, git helper functions.
- Produces: `syncDependencies(options): Promise<SyncResult>`
- Produces: `buildCommitMessage(changes: DependencyChange[]): string`

- [ ] **Step 1: Write failing sync tests**

Create `.github/scripts/test/sync-dependencies.test.mjs`:

```js
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { git } from "../lib/git.mjs";
import { buildCommitMessage, syncDependencies } from "../lib/sync-dependencies.mjs";

async function makeSourceRepo(name) {
  const dir = await mkdtemp(path.join(tmpdir(), `${name}-source-`));
  git(["init"], { cwd: dir });
  git(["config", "user.name", "Test"], { cwd: dir });
  git(["config", "user.email", "test@example.com"], { cwd: dir });
  await mkdir(path.join(dir, "skills", "demo"), { recursive: true });
  await writeFile(path.join(dir, "skills", "demo", "SKILL.md"), "---\nname: demo\ndescription: test\n---\n");
  await writeFile(path.join(dir, "LICENSE"), "license\n");
  git(["add", "--all"], { cwd: dir });
  git(["commit", "-m", "initial"], { cwd: dir });
  return dir;
}

test("buildCommitMessage renders add update remove list items", () => {
  assert.equal(
    buildCommitMessage([
      { action: "add", source: "owner/new", ref: "abc1234" },
      { action: "update", source: "owner/existing", ref: "def5678" },
      { action: "remove", source: "owner/old" }
    ]),
    "ci: sync dependencies\n\n- add owner/new (abc1234)\n- update owner/existing (def5678)\n- remove owner/old"
  );
});

test("syncDependencies deletes target before copy and writes upstream source", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "sync-root-"));
  const source = await makeSourceRepo("sync");
  await mkdir(path.join(root, "skills", "demo", "stale"), { recursive: true });
  await writeFile(path.join(root, "skills", "demo", "stale", "old.txt"), "old\n");
  await writeFile(
    path.join(root, "skills.json"),
    JSON.stringify({
      dependencies: [
        {
          source: "local/demo",
          repository: source,
          target: "skills/demo",
          mappings: ["skills/*:.", "LICENSE:LICENSE"]
        }
      ]
    })
  );
  git(["init"], { cwd: root });
  git(["config", "user.name", "Test"], { cwd: root });
  git(["config", "user.email", "test@example.com"], { cwd: root });
  git(["add", "--all"], { cwd: root });
  git(["commit", "-m", "baseline"], { cwd: root });

  const result = await syncDependencies({ rootDir: root, push: false, commit: false });
  const upstream = await readFile(path.join(root, "skills", "demo", ".upstream.yml"), "utf8");

  assert.equal(result.changes[0].action, "update");
  assert.match(upstream, /source: local\/demo/);
  assert.match(upstream, new RegExp(`repository: ${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  await assert.rejects(readFile(path.join(root, "skills", "demo", "stale", "old.txt"), "utf8"), /ENOENT/);
});
```

- [ ] **Step 2: Run sync tests to verify failure**

Run: `node --test .github/scripts/test/sync-dependencies.test.mjs`

Expected: FAIL with module not found for `../lib/sync-dependencies.mjs`.

- [ ] **Step 3: Implement sync engine**

Create `.github/scripts/lib/sync-dependencies.mjs`:

```js
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { globSync } from "node:fs";
import { git, gitAddAll, gitCommit, gitDiffCachedQuiet, gitHasPathChanges, gitOutput, gitPush } from "./git.mjs";
import { readSkillsManifest } from "./skills-manifest.mjs";
import { writeMarketplaceIfChanged } from "./marketplace.mjs";

export async function syncDependencies(options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const manifest = await readSkillsManifest(path.join(rootDir, "skills.json"));
  const declaredSources = new Set(manifest.dependencies.map((dependency) => dependency.source));
  const changes = [];

  for (const upstream of await findExistingUpstreams(rootDir)) {
    if (!declaredSources.has(upstream.source)) {
      await rm(upstream.targetDir, { recursive: true, force: true });
      changes.push({ action: "remove", source: upstream.source });
    }
  }

  for (const dependency of manifest.dependencies) {
    const targetDir = path.join(rootDir, dependency.target);
    const existed = await exists(targetDir);
    const sourceRepoDir = await cloneDependency(dependency);
    const ref = resolveRef(sourceRepoDir, dependency.useTags);
    if (dependency.useTags && ref) git(["checkout", ref], { cwd: sourceRepoDir });
    const commit = gitOutput(["rev-parse", "--short", "HEAD"], { cwd: sourceRepoDir });

    await rm(targetDir, { recursive: true, force: true });
    await mkdir(targetDir, { recursive: true });
    for (const mapping of dependency.mappings) {
      await copyMapping(sourceRepoDir, mapping, targetDir);
    }
    await writeFile(
      path.join(targetDir, ".upstream.yml"),
      formatUpstreamYaml({
        source: dependency.source,
        repository: dependency.repository,
        ref: ref || commit,
        commit
      })
    );

    if (gitHasPathChanges(dependency.target, rootDir)) {
      changes.push({ action: existed ? "update" : "add", source: dependency.source, ref: ref || commit });
    }
  }

  await writeMarketplaceIfChanged(rootDir);

  if (options.commit !== false) {
    gitAddAll(rootDir);
    if (!gitDiffCachedQuiet(rootDir)) {
      gitCommit(buildCommitMessage(changes), rootDir);
      if (options.push !== false) gitPush(rootDir);
    }
  }

  return { changes };
}

export function buildCommitMessage(changes) {
  const lines = ["ci: sync dependencies", ""];
  for (const change of changes) {
    if (change.action === "remove") lines.push(`- remove ${change.source}`);
    else lines.push(`- ${change.action} ${change.source} (${change.ref})`);
  }
  return lines.join("\n");
}

async function cloneDependency(dependency) {
  const dir = await mkdtemp(path.join(tmpdir(), "skill-dependency-"));
  git(["clone", dependency.repository, dir]);
  return dir;
}

function resolveRef(repoDir, useTags) {
  if (!useTags) return gitOutput(["rev-parse", "--short", "HEAD"], { cwd: repoDir });
  const result = git(["describe", "--tags", "--first-parent", "--abbrev=0"], {
    cwd: repoDir,
    allowFailure: true
  });
  return result.status === 0 ? result.stdout.trim() : "";
}

async function copyMapping(sourceRepoDir, mapping, targetDir) {
  const matches = globSync(path.join(sourceRepoDir, mapping.source));
  if (matches.length === 0) throw new Error(`No files found for source pattern '${mapping.source}'`);
  const destination = path.join(targetDir, mapping.target);
  if (matches.length === 1) {
    const source = matches[0];
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true, force: true });
    return;
  }
  await mkdir(destination, { recursive: true });
  for (const source of matches) {
    await cp(source, path.join(destination, path.basename(source)), { recursive: true, force: true });
  }
}

async function findExistingUpstreams(rootDir) {
  const matches = globSync(path.join(rootDir, "skills", "*", ".upstream.yml"));
  const upstreams = [];
  for (const file of matches) {
    const data = parseFlatYaml(await readFile(file, "utf8"));
    if (data?.source) upstreams.push({ source: data.source, targetDir: path.dirname(file) });
  }
  return upstreams;
}

function parseFlatYaml(raw) {
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return data;
}

function formatUpstreamYaml(data) {
  return [
    `source: ${data.source}`,
    `repository: ${data.repository}`,
    `ref: ${data.ref}`,
    `commit: ${data.commit}`,
    ""
  ].join("\n");
}

async function exists(file) {
  try {
    await readFile(file);
    return true;
  } catch (error) {
    if (error.code === "EISDIR") return true;
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
```

- [ ] **Step 4: Implement sync CLI**

Create `.github/scripts/sync-dependencies.mjs`:

```js
#!/usr/bin/env node
import { syncDependencies } from "./lib/sync-dependencies.mjs";

await syncDependencies();
```

- [ ] **Step 5: Run sync tests and fix API mismatches**

Run: `node --test .github/scripts/test/sync-dependencies.test.mjs`

Expected: PASS. If `repository` override is not yet accepted by `readSkillsManifest`, update that parser so local fixture tests can clone local repos while production still defaults to `https://github.com/<source>`.

- [ ] **Step 6: Run full test suite**

Run: `node --test .github/scripts/test/*.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add .github/scripts/lib/sync-dependencies.mjs .github/scripts/sync-dependencies.mjs .github/scripts/test/sync-dependencies.test.mjs .github/scripts/lib/skills-manifest.mjs
git commit -m "feat: sync dependencies from skills manifest"
```

## Task 4: Actions, Workflows, and `act` Verification

**Files:**
- Modify: `.github/actions/sync-dependency/action.yml`
- Delete: `.github/actions/sync-dependency/sync-dependency.sh`
- Create: `.github/actions/update-marketplace/action.yml`
- Modify: `.github/workflows/sync-dependencies.yml`
- Create: `.github/workflows/update-marketplace.yml`

**Interfaces:**
- Consumes: `.github/scripts/sync-dependencies.mjs`
- Consumes: `.github/scripts/update-marketplace.mjs`

- [ ] **Step 1: Replace sync action with JS CLI call**

Modify `.github/actions/sync-dependency/action.yml`:

```yaml
name: Sync dependencies
description: Sync all skill dependencies declared in skills.json and regenerate marketplace metadata.
runs:
  using: composite
  steps:
    - name: Sync dependencies
      shell: bash
      run: node .github/scripts/sync-dependencies.mjs
```

Delete `.github/actions/sync-dependency/sync-dependency.sh`.

- [ ] **Step 2: Add marketplace action**

Create `.github/actions/update-marketplace/action.yml`:

```yaml
name: Update marketplace
description: Regenerate .claude-plugin/marketplace.json from skills folders.
runs:
  using: composite
  steps:
    - name: Update marketplace
      shell: bash
      run: node .github/scripts/update-marketplace.mjs
```

- [ ] **Step 3: Update sync workflow**

Modify `.github/workflows/sync-dependencies.yml`:

```yaml
name: Sync dependencies

on:
  workflow_dispatch:
  schedule:
    - cron: "0 */12 * * *"
  push:
    paths:
      - skills.json
      - .github/actions/sync-dependency/**
      - .github/scripts/**
      - .github/workflows/sync-dependencies.yml

jobs:
  sync-dependencies:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Check out repo
        uses: actions/checkout@v7

      - name: Sync dependencies
        uses: ./.github/actions/sync-dependency
```

- [ ] **Step 4: Add marketplace workflow**

Create `.github/workflows/update-marketplace.yml`:

```yaml
name: Update marketplace

on:
  workflow_dispatch:
  push:
    paths:
      - skills/**
      - skills.json
      - .github/actions/update-marketplace/**
      - .github/scripts/**
      - .github/workflows/update-marketplace.yml

jobs:
  update-marketplace:
    if: github.actor != 'github-actions[bot]'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Check out repo
        uses: actions/checkout@v7

      - name: Update marketplace
        uses: ./.github/actions/update-marketplace
```

- [ ] **Step 5: Run full tests**

Run: `node --test .github/scripts/test/*.test.mjs`

Expected: PASS.

- [ ] **Step 6: Run sync workflow with act**

Run: `act workflow_dispatch -W .github/workflows/sync-dependencies.yml`

Expected: sync and marketplace steps complete. If changes are committed locally inside the action container, run may fail at `git push`; that failure is acceptable only after commit/message generation succeeds.

- [ ] **Step 7: Run marketplace workflow with act**

Run: `act workflow_dispatch -W .github/workflows/update-marketplace.yml`

Expected: marketplace generation completes. If there is no marketplace diff, workflow exits successfully before commit. If it creates a commit, failure at `git push` is acceptable.

- [ ] **Step 8: Inspect generated files**

Run:

```bash
git status --short
sed -n '1,160p' .claude-plugin/marketplace.json
sed -n '1,80p' skills/caveman/.upstream.yml
```

Expected:

- `.claude-plugin/marketplace.json` exists and has plugin entries for category folders.
- `skills/caveman/.upstream.yml` includes `source: JuliusBrussee/caveman`.
- `skills.json` is unchanged by scripts.

- [ ] **Step 9: Commit Task 4**

Run:

```bash
git add --all
git commit -m "ci: sync skill dependencies from manifest"
```

## Self-Review

Spec coverage:

- `skills.json` dependency-only JSON: Task 1.
- colon-separated mappings: Task 1 parser tests and Task 3 sync use.
- JS scripts instead of bash core logic: Tasks 1-4.
- reusable git helper: Task 1 and consumed by Tasks 2-3.
- delete target before copy: Task 3.
- `.upstream.yml` source metadata: Task 3.
- removed dependency detection from `.upstream.yml`: Task 3.
- fully generated marketplace: Task 2.
- custom category folder grouping and flat skill omission: Task 2.
- grouped commit body with add/update/remove: Task 3.
- standalone marketplace workflow: Task 4.
- `act` verification with expected push failure: Task 4.

Placeholder scan: no placeholder markers or deferred-work steps.

Type consistency: exported function names used by later tasks match earlier interface declarations.
