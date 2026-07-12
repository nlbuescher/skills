import { spawn } from "node:child_process";

export function runCommand(command, args, options = {}) {
  const { cwd, env, print = true, allowFailure } = options;

  if (print) {
    process.stdout.write(`$ ${command} ${args.join(" ")}\n`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let settled = false;

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (print) {
        process.stdout.write(chunk);
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (print) {
        process.stderr.write(chunk);
      }
    });
    child.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
    child.on("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      const result = { status: code ?? 1, stdout, stderr };
      if (!allowFailure && result.status !== 0) {
        reject(new Error(`${command} ${args.join(" ")} failed\n${stderr}`));
        return;
      }

      resolve(result);
    });
  });
}

export function printProgress(message, print = true) {
  if (print) {
    process.stdout.write(`${message}\n`);
  }
}
