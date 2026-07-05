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
