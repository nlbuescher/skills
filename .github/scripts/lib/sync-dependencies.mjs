import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { globSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  git,
  gitAddAll,
  gitCommit,
  gitDiffCachedQuiet,
  gitHasPathChanges,
  gitOutput,
  gitPush
} from "./git.mjs";
import { writeMarketplaceIfChanged } from "./marketplace.mjs";
import { readSkillsManifest } from "./skills-manifest.mjs";

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
    const sourceRepoDir = await cloneDependency(dependency.repository);
    const ref = checkoutRef(sourceRepoDir, dependency.useTags);
    const commit = gitOutput(["rev-parse", "--short", "HEAD"], { cwd: sourceRepoDir });

    await rm(targetDir, { recursive: true, force: true });
    await mkdir(targetDir, { recursive: true });

    for (const mapping of dependency.mappings) {
      await copyMapping(sourceRepoDir, mapping, targetDir);
    }

    await writeFile(
      path.join(targetDir, ".upstream.yml"),
      formatUpstream({
        source: dependency.source,
        repository: dependency.repository,
        ref,
        commit
      })
    );

    if (gitHasPathChanges(dependency.target, rootDir)) {
      changes.push({
        action: existed ? "update" : "add",
        source: dependency.source,
        ref
      });
    }
  }

  await writeMarketplaceIfChanged(rootDir);

  if (options.commit !== false) {
    gitAddAll(rootDir);
    if (!gitDiffCachedQuiet(rootDir)) {
      gitCommit(buildCommitMessage(changes), rootDir);
      if (options.push !== false) {
        gitPush(rootDir);
      }
    }
  }

  return { changes };
}

export function buildCommitMessage(changes) {
  const lines = ["ci: sync dependencies"];

  if (changes.length > 0) {
    lines.push("");
    for (const change of changes) {
      if (change.action === "remove") {
        lines.push(`- remove ${change.source}`);
        continue;
      }
      lines.push(`- ${change.action} ${change.source} (${change.ref})`);
    }
  }

  return lines.join("\n");
}

async function cloneDependency(repository) {
  const dir = await mkdtemp(path.join(tmpdir(), "skill-dependency-"));
  git(["clone", "--quiet", repository, dir]);
  return dir;
}

function checkoutRef(repoDir, useTags) {
  if (!useTags) {
    return gitOutput(["rev-parse", "--short", "HEAD"], { cwd: repoDir });
  }

  const tag = git(["describe", "--tags", "--first-parent", "--abbrev=0"], {
    cwd: repoDir,
    allowFailure: true
  });

  if (tag.status !== 0) {
    return gitOutput(["rev-parse", "--short", "HEAD"], { cwd: repoDir });
  }

  const ref = tag.stdout.trim();
  git(["checkout", "--quiet", ref], { cwd: repoDir });
  return ref;
}

async function copyMapping(sourceRepoDir, mapping, targetDir) {
  const matches = globSync(mapping.source, { cwd: sourceRepoDir }).sort();

  if (matches.length === 0) {
    throw new Error(`No files found for source pattern '${mapping.source}'`);
  }

  const destination = path.join(targetDir, mapping.target);

  if (matches.length === 1) {
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(sourceRepoDir, matches[0]), destination, { recursive: true, force: true });
    return;
  }

  await mkdir(destination, { recursive: true });
  for (const match of matches) {
    await cp(path.join(sourceRepoDir, match), path.join(destination, path.basename(match)), {
      recursive: true,
      force: true
    });
  }
}

async function findExistingUpstreams(rootDir) {
  const upstreams = [];
  for (const relativeFile of globSync("skills/**/.upstream.yml", { cwd: rootDir })) {
    const file = path.join(rootDir, relativeFile);
    const data = parseFlatFile(await readFile(file, "utf8"));
    if (data.source) {
      upstreams.push({
        source: data.source,
        targetDir: path.dirname(file)
      });
    }
  }
  return upstreams;
}

function parseFlatFile(raw) {
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return data;
}

function formatUpstream(data) {
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
    if (error.code === "EISDIR") {
      return true;
    }
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
