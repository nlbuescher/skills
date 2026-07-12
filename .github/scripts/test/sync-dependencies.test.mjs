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
  await git(["init"], { cwd: dir, print: false });
  await git(["config", "user.name", "Test"], { cwd: dir, print: false });
  await git(["config", "user.email", "test@example.com"], { cwd: dir, print: false });
  await mkdir(path.join(dir, "skills", "demo"), { recursive: true });
  await mkdir(path.join(dir, "agents"), { recursive: true });
  await writeFile(path.join(dir, "skills", "demo", "SKILL.md"), "---\nname: demo\ndescription: test\n---\n");
  await writeFile(path.join(dir, "agents", "helper.txt"), "helper\n");
  await writeFile(path.join(dir, "LICENSE"), "license\n");
  await git(["add", "--all"], { cwd: dir, print: false });
  await git(["commit", "-m", "initial"], { cwd: dir, print: false });
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
          mappings: ["skills/*:.", "LICENSE:LICENSE", "agents:cavecrew/agents"]
        }
      ]
    })
  );
  await git(["init"], { cwd: root, print: false });
  await git(["config", "user.name", "Test"], { cwd: root, print: false });
  await git(["config", "user.email", "test@example.com"], { cwd: root, print: false });
  await git(["add", "--all"], { cwd: root, print: false });
  await git(["commit", "-m", "baseline"], { cwd: root, print: false });

  const result = await syncDependencies({ rootDir: root, push: false, commit: false, print: false });
  const upstream = await readFile(path.join(root, "skills", "demo", ".upstream.yml"), "utf8");

  assert.equal(result.changes[0].action, "update");
  assert.match(upstream, /source: local\/demo/);
  assert.match(upstream, new RegExp(`repository: ${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  await assert.rejects(readFile(path.join(root, "skills", "demo", "stale", "old.txt"), "utf8"), /ENOENT/);
  assert.equal(
    await readFile(path.join(root, "skills", "demo", "cavecrew", "agents", "helper.txt"), "utf8"),
    "helper\n"
  );
});

test("syncDependencies reports copy destinations relative to the repository root", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "sync-progress-root-"));
  const source = await makeSourceRepo("sync-progress");
  const output = [];
  const originalLog = console.log;
  console.log = (message) => output.push(message);

  try {
    await writeFile(
      path.join(root, "skills.json"),
      JSON.stringify({
        dependencies: [
          {
            source: "local/demo",
            repository: source,
            target: "skills/demo",
            mappings: ["skills/*:.", "LICENSE:LICENSE", "agents:cavecrew/agents"]
          }
        ]
      })
    );
    await git(["init"], { cwd: root, print: false });
    await git(["config", "user.name", "Test"], { cwd: root, print: false });
    await git(["config", "user.email", "test@example.com"], { cwd: root, print: false });
    await git(["add", "--all"], { cwd: root, print: false });
    await git(["commit", "-m", "baseline"], { cwd: root, print: false });

    await syncDependencies({ rootDir: root, push: false, commit: false, print: true });
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(
    output.filter((line) => line.startsWith("Copying ")),
    [
      "Copying skills/demo to skills/demo",
      "Copying LICENSE to skills/demo/LICENSE",
      "Copying agents to skills/demo/cavecrew/agents"
    ]
  );
});

test("syncDependencies leaves marketplace generation to the marketplace workflow", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "sync-no-marketplace-root-"));
  const source = await makeSourceRepo("sync-no-marketplace");
  await writeFile(
    path.join(root, "skills.json"),
    JSON.stringify({
      dependencies: [
        {
          source: "local/demo",
          repository: source,
          target: "skills/demo",
          mappings: ["skills/*:."]
        }
      ]
    })
  );
  await git(["init"], { cwd: root, print: false });
  await git(["config", "user.name", "Test"], { cwd: root, print: false });
  await git(["config", "user.email", "test@example.com"], { cwd: root, print: false });
  await git(["add", "--all"], { cwd: root, print: false });
  await git(["commit", "-m", "baseline"], { cwd: root, print: false });

  await syncDependencies({ rootDir: root, push: false, commit: false, print: false });

  await assert.rejects(
    readFile(path.join(root, ".claude-plugin", "marketplace.json"), "utf8"),
    /ENOENT/
  );
});

test("syncDependencies removes legacy upstream tracked only by repository url", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "sync-legacy-root-"));
  await mkdir(path.join(root, "skills", "old"), { recursive: true });
  await writeFile(path.join(root, "skills", "old", "old.txt"), "old\n");
  await writeFile(
    path.join(root, "skills", "old", ".upstream.yml"),
    "repository: https://github.com/owner/old\nref: abc1234\ncommit: abc1234\n"
  );
  await writeFile(path.join(root, "skills.json"), JSON.stringify({ dependencies: [] }));
  await git(["init"], { cwd: root, print: false });
  await git(["config", "user.name", "Test"], { cwd: root, print: false });
  await git(["config", "user.email", "test@example.com"], { cwd: root, print: false });
  await git(["add", "--all"], { cwd: root, print: false });
  await git(["commit", "-m", "baseline"], { cwd: root, print: false });

  const result = await syncDependencies({ rootDir: root, push: false, commit: false, print: false });

  await assert.rejects(readFile(path.join(root, "skills", "old", "old.txt"), "utf8"), /ENOENT/);
  assert.deepEqual(result.changes, [{ action: "remove", source: "owner/old" }]);
});
