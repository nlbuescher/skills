import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildMarketplace,
  compareCodePointStrings,
  writeMarketplaceIfChanged
} from "../lib/marketplace.mjs";

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

test("compareCodePointStrings uses plain code point ordering", () => {
  assert.equal(compareCodePointStrings("alpha", "alpha"), 0);
  assert.equal(compareCodePointStrings("alpha", "beta"), -1);
  assert.equal(compareCodePointStrings("beta", "alpha"), 1);
  assert.equal(compareCodePointStrings("z", "ä"), -1);
});

test("writeMarketplaceIfChanged writes only when normalized output changes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "marketplace-write-"));
  await skill(root, "skills/caveman/caveman", "caveman");

  assert.equal(await writeMarketplaceIfChanged(root, { print: false }), true);
  const first = await readFile(path.join(root, ".claude-plugin/marketplace.json"), "utf8");
  assert.equal(await writeMarketplaceIfChanged(root, { print: false }), false);
  const second = await readFile(path.join(root, ".claude-plugin/marketplace.json"), "utf8");
  assert.equal(second, first);
});
