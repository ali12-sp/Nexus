import http from "node:http";

import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { registerSocketServer } from "./sockets/index.js";

const app = createApp();
const server = http.createServer(app);

registerSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`Nexus backend running on http://localhost:${env.PORT}`);
});

const gracefulShutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", () => {
  void gracefulShutdown();
});

process.on("SIGINT", () => {
  void gracefulShutdown();
});
