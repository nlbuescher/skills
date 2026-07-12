# Skill Dependency Sync Design

## Goal

Replace the per-dependency workflow configuration with one repository-level `skills.json` file. The sync workflow reads that file, syncs all declared upstream skill dependencies, and commits any resulting dependency changes in one grouped commit. That push then triggers the marketplace workflow when the synced dependency files changed.

The generated marketplace supports manually authored skills in category folders. The `skills.json` file is input only and must not be modified by sync or marketplace logic.

## Source Files

### `skills.json`

`skills.json` lives at the repository root and declares only external dependencies. It is not a complete inventory of all skills in the repo.

Example:

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
    }
  ]
}
```

Fields:

- `source`: GitHub `owner/repo` slug. The sync script clones `https://github.com/<source>`.
- `target`: local directory to replace with mapped upstream files.
- `use-tags`: when true, sync the latest first-parent tag instead of the source HEAD.
- `mappings`: list of colon-separated `source:target` strings, preserving the current arbitrary file mapping behavior.

### `.upstream.yml`

Each synced dependency target gets a generated `.upstream.yml` file. It is both human provenance and the ownership marker used to detect removed dependencies.

Example for SHA sync:

```yaml
source: JuliusBrussee/caveman
repository: https://github.com/JuliusBrussee/caveman
ref: abc1234
commit: abc1234
```

Example for tag sync:

```yaml
source: owner/repo
repository: https://github.com/owner/repo
ref: v1.2.3
commit: deadbee
```

## Sync Workflow

The workflow uses JavaScript scripts for core logic. Shell remains limited to GitHub Actions step wiring if needed.

Both sync and marketplace scripts use a shared JavaScript git helper instead of calling `child_process` directly. The helper wraps `git` invocations with argument arrays, captures stdout/stderr consistently, and exposes small named functions for common operations such as `gitAddAll`, `gitDiffCachedQuiet`, `gitCommit`, `gitPush`, `gitStatusShort`, and path-scoped diff checks.

Flow:

1. Read `skills.json`.
2. Scan `skills/*/.upstream.yml` for dependency-owned directories.
3. Remove dependency-owned directories whose `source` no longer appears in `skills.json`.
4. For every dependency in `skills.json`:
   - clone its source repository,
   - resolve the synced ref,
   - record whether the target existed before sync,
   - delete the target directory,
   - copy all declared mappings into the target,
   - write `.upstream.yml`.
5. Run `git add --all`.
6. If there is no staged diff, exit without committing.
7. Otherwise commit and push.

The sync script never writes `skills.json`.

## Change Classification

The sync workflow produces one grouped commit for all generated changes.

Commit subject:

```text
ci: sync dependencies
```

Commit body has one line per changed dependency:

```text
- add JuliusBrussee/caveman (abc1234)
- update obra/superpowers (d884ae0)
- remove old-owner/old-repo
```

Rules:

- `add`: target did not exist before sync and target files changed.
- `update`: target existed before sync and target files changed.
- `remove`: existing `.upstream.yml` source is no longer declared in `skills.json`.
- unchanged dependencies are omitted.
- add/update entries include the resolved ref.
- remove entries do not include a ref.

Marketplace changes are intentionally not included in the dependency sync commit. Sync pushes that change `skills/**` trigger the standalone marketplace workflow, which regenerates marketplace metadata in a follow-up commit only when the generated marketplace file changes.

## Marketplace Generation

`.claude-plugin/marketplace.json` is entirely generated every time. No manual entries are preserved.

Inputs:

- actual `skills/**/SKILL.md` files,
- category folder structure.

Rules:

- Generate one plugin entry per immediate category folder under `skills/`.
- The plugin name is the category folder name.
- Skill paths inside that category are listed under that plugin.
- Skills with no category folder, such as `skills/grill-me/SKILL.md`, are omitted from the marketplace. `npx skills` will show them under `Other`.
- No custom name or title mapping exists. Folder names are source of truth.
- The JSON output is stable and deterministic.

Example output shape:

```json
{
  "metadata": {
    "pluginRoot": "./"
  },
  "plugins": [
    {
      "name": "caveman",
      "source": "./skills/caveman",
      "skills": [
        "./caveman/SKILL.md",
        "./cavecrew/SKILL.md"
      ]
    }
  ]
}
```

## Standalone Marketplace Workflow

A separate marketplace workflow handles dependency sync pushes and manual custom skill changes.

Trigger paths:

- `skills/**`
- `skills.json`
- marketplace action/script files
- marketplace workflow file

The marketplace updater:

1. scans current `skills/**/SKILL.md`,
2. builds the generated marketplace JSON in memory,
3. compares it with `.claude-plugin/marketplace.json`,
4. exits without writing if the normalized content is identical,
5. writes the file only when output changes,
6. commits only when there is a repository diff.

The standalone marketplace workflow also runs for pushes from `github-actions[bot]`, so dependency sync commits can trigger marketplace regeneration.

## Testing

Tests cover:

- shared git helper functions wrap `child_process` calls and are used by sync and marketplace scripts,
- parsing `skills.json` with colon-separated mappings,
- sync deletion before copy removes upstream-deleted files,
- `.upstream.yml` includes `source`,
- removed dependencies are detected from `.upstream.yml`,
- commit message body includes add/update/remove lines correctly,
- marketplace generator groups category folders,
- flat `skills/<skill>/SKILL.md` is omitted from marketplace,
- marketplace output is stable,
- marketplace updater no-ops when generated output matches existing file.

Workflow verification uses `act` for local GitHub Actions execution. Runs are expected to fail at `git push`; verification passes when the selected workflow logic completes correctly before that push failure.
