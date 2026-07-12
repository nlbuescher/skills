#!/usr/bin/env node
import { writeMarketplaceIfChanged } from "./lib/marketplace.mjs";
import { gitAddAll, gitCommit, gitDiffCachedQuiet, gitPush } from "./lib/git.mjs";

const print = true;
const changed = await writeMarketplaceIfChanged(process.cwd(), { print });
if (!changed) {
  console.log("Marketplace already up-to-date.");
  process.exit(0);
}

await gitAddAll(process.cwd(), { print });
if (await gitDiffCachedQuiet(process.cwd(), { print })) {
  console.log("No marketplace changes to commit.");
  process.exit(0);
}

await gitCommit("ci: update marketplace", process.cwd(), { print });
await gitPush(process.cwd(), { print });
