import http from "node:http";

import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { registerSocketServer } from "./sockets/index.js";
import { logError, logInfo } from "./utils/logger.js";

const app = createApp();
const server = http.createServer(app);

registerSocketServer(server);

let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logInfo("Graceful shutdown requested", { signal });

  await prisma.$disconnect();

  server.close((error) => {
    if (error) {
      logError("HTTP server failed to close cleanly", {
        signal,
        errorName: error.name,
        errorMessage: error.message,
      });
      process.exit(1);
    }

    process.exit(0);
  });
};

const startServer = async () => {
  try {
    await prisma.$connect();

    server.listen(env.PORT, () => {
      logInfo("Nexus backend running", {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });
  } catch (error) {
    const runtimeError = error instanceof Error ? error : new Error("Unknown startup error");
    logError("Failed to start Nexus backend", {
      errorName: runtimeError.name,
      errorMessage: runtimeError.message,
    });
    process.exit(1);
  }
};

void startServer();

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logError("Unhandled promise rejection", {
    errorName: error.name,
    errorMessage: error.message,
  });
});

process.on("uncaughtException", (error) => {
  logError("Uncaught exception", {
    errorName: error.name,
    errorMessage: error.message,
  });
  void gracefulShutdown("uncaughtException");
});
