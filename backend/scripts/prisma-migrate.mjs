import { spawn } from "node:child_process";

const [major] = process.versions.node.split(".").map(Number);

if (process.platform === "win32" && major >= 24) {
  console.error(
    [
      "Prisma migrate on Windows is not reliable with the current local Node runtime.",
      `Detected Node.js ${process.versions.node}.`,
      "Use Node 20.x locally for migrations, then rerun `npm run prisma:migrate`.",
      "The project is pinned to Node 20.x for local parity and live deployment.",
    ].join("\n"),
  );
  process.exit(1);
}

const command = process.platform === "win32" ? "prisma.cmd" : "prisma";
const child = spawn(command, ["migrate", "deploy"], {
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Failed to run Prisma migrate deploy.", error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
