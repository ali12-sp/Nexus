import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceDir = resolve(scriptDir, "..");
const nextBin = resolve(workspaceDir, "node_modules/next/dist/bin/next");
const args = process.argv.slice(2);

const env = {
  ...process.env,
  NEXT_IGNORE_INCORRECT_LOCKFILE:
    process.env.NEXT_IGNORE_INCORRECT_LOCKFILE ?? "1",
};

const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: workspaceDir,
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to launch Next.js command.", error);
  process.exit(1);
});
