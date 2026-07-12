import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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
        skills: skills.sort(compareCodePointStrings)
      });
    }
  }

  return {
    metadata: { pluginRoot: "./" },
    plugins: plugins.sort((left, right) => compareCodePointStrings(left.name, right.name))
  };
}

export async function writeMarketplaceIfChanged(rootDir = process.cwd(), options = {}) {
  const print = options.print ?? true;
  const marketplace = await buildMarketplace(rootDir);
  const output = `${JSON.stringify(marketplace, null, 2)}\n`;
  const file = path.join(rootDir, ".claude-plugin", "marketplace.json");
  const current = await readTextIfExists(file);

  if (current === output) {
    return false;
  }

  report("Generating marketplace", print);
  await mkdir(path.dirname(file), { recursive: true });
  report("Writing .claude-plugin/marketplace.json", print);
  await writeFile(file, output);
  return true;
}

function report(message, print) {
  if (print) {
    console.log(message);
  }
}

async function safeDirNames(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort(compareCodePointStrings);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function compareCodePointStrings(left, right) {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

async function exists(file) {
  try {
    await readFile(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function readTextIfExists(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}
