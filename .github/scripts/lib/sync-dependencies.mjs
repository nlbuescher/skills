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
import { readSkillsManifest } from "./skills-manifest.mjs";

export async function syncDependencies(options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const print = options.print ?? true;
  const manifest = await readSkillsManifest(path.join(rootDir, "skills.json"));
  const declaredSources = new Set(manifest.dependencies.map((dependency) => dependency.source));
  const changes = [];

  for (const upstream of await findExistingUpstreams(rootDir)) {
    if (!declaredSources.has(upstream.source)) {
      report(`Removing ${path.relative(rootDir, upstream.targetDir)}`, print);
      await rm(upstream.targetDir, { recursive: true, force: true });
      changes.push({ action: "remove", source: upstream.source });
    }
  }

  for (const dependency of manifest.dependencies) {
    report(`Syncing ${dependency.source}`, print);
    const targetDir = path.join(rootDir, dependency.target);
    const existed = await exists(targetDir);
    const sourceRepoDir = await cloneDependency(dependency.repository, print);
    const ref = await checkoutRef(sourceRepoDir, dependency.useTags, print);
    const commit = await gitOutput(["rev-parse", "--short", "HEAD"], {
      cwd: sourceRepoDir,
      print
    });

    report(`Removing ${dependency.target}`, print);
    await rm(targetDir, { recursive: true, force: true });
    await mkdir(targetDir, { recursive: true });

    for (const mapping of dependency.mappings) {
      await copyMapping(sourceRepoDir, mapping, targetDir, rootDir, print);
    }

    report(`Writing ${path.posix.join(dependency.target, ".upstream.yml")}`, print);
    await writeFile(
      path.join(targetDir, ".upstream.yml"),
      formatUpstream({
        source: dependency.source,
        repository: dependency.repository,
        ref,
        commit
      })
    );

    if (await gitHasPathChanges(dependency.target, rootDir, { print })) {
      changes.push({
        action: existed ? "update" : "add",
        source: dependency.source,
        ref
      });
    }
  }

  if (options.commit !== false) {
    await gitAddAll(rootDir, { print });
    if (!(await gitDiffCachedQuiet(rootDir, { print }))) {
      await gitCommit(buildCommitMessage(changes), rootDir, { print });
      if (options.push !== false) {
        await gitPush(rootDir, { print });
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

async function cloneDependency(repository, print) {
  const dir = await mkdtemp(path.join(tmpdir(), "skill-dependency-"));
  await git(["clone", "--quiet", repository, dir], { print });
  return dir;
}

async function checkoutRef(repoDir, useTags, print) {
  if (!useTags) {
    return await gitOutput(["rev-parse", "--short", "HEAD"], { cwd: repoDir, print });
  }

  const tag = await git(["describe", "--tags", "--first-parent", "--abbrev=0"], {
    cwd: repoDir,
    allowFailure: true,
    print
  });

  if (tag.status !== 0) {
    return await gitOutput(["rev-parse", "--short", "HEAD"], { cwd: repoDir, print });
  }

  const ref = tag.stdout.trim();
  await git(["checkout", "--quiet", ref], { cwd: repoDir, print });
  return ref;
}

async function copyMapping(sourceRepoDir, mapping, targetDir, rootDir, print) {
  const matches = globSync(mapping.source, { cwd: sourceRepoDir }).sort();

  if (matches.length === 0) {
    throw new Error(`No files found for source pattern '${mapping.source}'`);
  }

  const destination = path.join(targetDir, mapping.target);

  if (matches.length === 1) {
    await mkdir(path.dirname(destination), { recursive: true });
    report(`Copying ${matches[0]} to ${path.relative(rootDir, destination)}`, print);
    await cp(path.join(sourceRepoDir, matches[0]), destination, { recursive: true, force: true });
    return;
  }

  await mkdir(destination, { recursive: true });
  for (const match of matches) {
    const output = path.join(destination, path.basename(match));
    report(`Copying ${match} to ${path.relative(rootDir, output)}`, print);
    await cp(path.join(sourceRepoDir, match), output, {
      recursive: true,
      force: true
    });
  }
}

function report(message, print) {
  if (print) {
    console.log(message);
  }
}

async function findExistingUpstreams(rootDir) {
  const upstreams = [];
  for (const relativeFile of globSync("skills/**/.upstream.yml", { cwd: rootDir })) {
    const file = path.join(rootDir, relativeFile);
    const data = parseFlatFile(await readFile(file, "utf8"));
    const source = data.source || sourceFromRepository(data.repository);
    if (source) {
      upstreams.push({
        source,
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

function sourceFromRepository(repository) {
  if (typeof repository !== "string") {
    return "";
  }

  const match = /^https:\/\/github\.com\/([^/]+\/[^/\s]+?)(?:\.git)?$/.exec(repository.trim());
  return match ? match[1] : "";
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
