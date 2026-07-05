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
