import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { printProgress, runCommand } from "../lib/command.mjs";

const execFileAsync = promisify(execFile);
const commandModule = new URL("../lib/command.mjs", import.meta.url).href;

test("runCommand captures streams", async () => {
  const result = await runCommand(
    process.execPath,
    ["-e", "process.stdout.write('out'); process.stderr.write('err')"],
    { print: false }
  );

  assert.deepEqual(result, { status: 0, stdout: "out", stderr: "err" });
});

test("runCommand rejects unexpected nonzero exits", async () => {
  await assert.rejects(
    runCommand(process.execPath, ["-e", "process.exit(7)"], { print: false }),
    /failed/
  );
});

test("runCommand returns nonzero exits when allowed", async () => {
  const result = await runCommand(
    process.execPath,
    ["-e", "process.stderr.write('err'); process.exit(7)"],
    { allowFailure: true, print: false }
  );

  assert.deepEqual(result, { status: 7, stdout: "", stderr: "err" });
});

test("runCommand forwards its command and streams when printing", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    "--input-type=module",
    "-e",
    `import { runCommand } from ${JSON.stringify(commandModule)};
     await runCommand(process.execPath, ["-e", "process.stdout.write('out'); process.stderr.write('err')"]);`
  ]);

  assert.match(stdout, /^\$ .* -e process\.stdout\.write\('out'\); process\.stderr\.write\('err'\)\nout$/);
  assert.equal(stderr, "err");
});

test("runCommand suppresses its command and streams when printing is disabled", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    "--input-type=module",
    "-e",
    `import { runCommand } from ${JSON.stringify(commandModule)};
     const result = await runCommand(
       process.execPath,
       ["-e", "process.stdout.write('out'); process.stderr.write('err')"],
       { print: false }
     );
     process.stdout.write(JSON.stringify(result));`
  ]);

  assert.equal(stdout, '{"status":0,"stdout":"out","stderr":"err"}');
  assert.equal(stderr, "");
});

test("printProgress prints one newline-terminated message only when enabled", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    "--input-type=module",
    "-e",
    `import { printProgress } from ${JSON.stringify(commandModule)};
     printProgress("Progress");
     printProgress("Hidden", false);`
  ]);

  assert.equal(stdout, "Progress\n");
  assert.equal(stderr, "");
});
