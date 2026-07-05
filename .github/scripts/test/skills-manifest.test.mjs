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

  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const manifest = await readSkillsManifest();

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
  } finally {
    process.chdir(cwd);
  }
});

test("readSkillsManifest throws when dependencies missing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "skills-manifest-missing-"));
  await writeFile(path.join(dir, "skills.json"), JSON.stringify({}));

  await assert.rejects(readSkillsManifest(path.join(dir, "skills.json")), /dependencies must be an array/);
});

test("readSkillsManifest throws when manifest root is null", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "skills-manifest-null-"));
  await writeFile(path.join(dir, "skills.json"), "null");

  await assert.rejects(
    readSkillsManifest(path.join(dir, "skills.json")),
    /skills manifest root must be an object/
  );
});

test("readSkillsManifest throws when dependency entry is not object", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "skills-manifest-entry-"));
  await writeFile(
    path.join(dir, "skills.json"),
    JSON.stringify({
      dependencies: ["not-an-object"]
    })
  );

  await assert.rejects(
    readSkillsManifest(path.join(dir, "skills.json")),
    /dependency entry at index 0 must be an object/
  );
});
