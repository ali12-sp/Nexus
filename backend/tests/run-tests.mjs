import assert from "node:assert/strict";
import http from "node:http";

process.env.NODE_ENV ??= "test";
process.env.PORT ??= "4000";
process.env.CLIENT_URL ??= "http://localhost:3000";
process.env.DATABASE_URL ??=
  "postgresql://postgres:postgres@localhost:5432/nexus?schema=public";
process.env.JWT_SECRET ??= "test-access-secret-123456";
process.env.JWT_EXPIRES_IN ??= "15m";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-123456";
process.env.JWT_REFRESH_EXPIRES_IN ??= "30d";
process.env.REFRESH_TOKEN_COOKIE_NAME ??= "nexus_rt";
process.env.COOKIE_SECURE ??= "false";
process.env.UPLOAD_DIR ??= "uploads";
process.env.MAX_FILE_SIZE_MB ??= "10";
process.env.PAYMENT_PROVIDER ??= "MOCK";
process.env.SMTP_FROM ??= "noreply@nexus.local";
process.env.OTP_EXPIRY_MINUTES ??= "10";

const { createApp } = await import("../dist/app.js");
const { createSessionTokens, verifyAccessToken, verifyRefreshToken } = await import(
  "../dist/utils/auth.js"
);
const { readCookie } = await import("../dist/utils/cookies.js");

const tests = [
  {
    name: "session tokens are signed and can be verified independently",
    run: () => {
      const result = createSessionTokens("user_123");

      const accessPayload = verifyAccessToken(result.accessToken);
      const refreshPayload = verifyRefreshToken(result.refreshToken);

      assert.equal(accessPayload.sub, "user_123");
      assert.equal(refreshPayload.sub, "user_123");
      assert.ok(result.accessTokenExpiresAt instanceof Date);
      assert.ok(result.refreshTokenExpiresAt instanceof Date);
      assert.ok(result.refreshTokenExpiresAt > result.accessTokenExpiresAt);
    },
  },
  {
    name: "cookie reader returns a decoded refresh token value",
    run: () => {
      const cookieHeader = "theme=dark; nexus_rt=refresh%2Btoken%3D123; Path=/api/auth";
      const cookieValue = readCookie(cookieHeader, "nexus_rt");

      assert.equal(cookieValue, "refresh+token=123");
    },
  },
  {
    name: "health endpoint responds with status and request id",
    run: async () => {
      const app = createApp();
      const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
      });

      try {
        const address = server.address();

        if (!address || typeof address === "string") {
          throw new Error("Unable to determine test server port");
        }

        const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
        const payload = await response.json();

        assert.equal(response.status, 200);
        assert.equal(payload.success, true);
        assert.equal(payload.data.status, "ok");
        assert.ok(response.headers.get("x-request-id"));
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }
    },
  },
  {
    name: "refresh endpoint rejects requests without a refresh cookie",
    run: async () => {
      const app = createApp();
      const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
      });

      try {
        const address = server.address();

        if (!address || typeof address === "string") {
          throw new Error("Unable to determine test server port");
        }

        const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/refresh`, {
          method: "POST",
        });
        const payload = await response.json();

        assert.equal(response.status, 401);
        assert.equal(payload.success, false);
        assert.equal(payload.message, "Refresh token missing");
        assert.ok(payload.meta?.requestId);
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }
    },
  },
  {
    name: "logout endpoint clears the browser session successfully",
    run: async () => {
      const app = createApp();
      const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
      });

      try {
        const address = server.address();

        if (!address || typeof address === "string") {
          throw new Error("Unable to determine test server port");
        }

        const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/logout`, {
          method: "POST",
        });
        const payload = await response.json();

        assert.equal(response.status, 200);
        assert.equal(payload.success, true);
        assert.equal(payload.data.loggedOut, true);
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }
    },
  },
  {
    name: "runtime metrics endpoint exposes lightweight operational telemetry",
    run: async () => {
      const app = createApp();
      const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
      });

      try {
        const address = server.address();

        if (!address || typeof address === "string") {
          throw new Error("Unable to determine test server port");
        }

        const response = await fetch(`http://127.0.0.1:${address.port}/api/metrics/runtime`);
        const payload = await response.json();

        assert.equal(response.status, 200);
        assert.equal(payload.success, true);
        assert.equal(typeof payload.data.nodeVersion, "string");
        assert.equal(typeof payload.data.uptimeSeconds, "number");
        assert.equal(typeof payload.data.memoryUsageMb.heapUsed, "number");
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }
    },
  },
  {
    name: "unknown routes return a request-scoped not found response",
    run: async () => {
      const app = createApp();
      const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
      });

      try {
        const address = server.address();

        if (!address || typeof address === "string") {
          throw new Error("Unable to determine test server port");
        }

        const response = await fetch(`http://127.0.0.1:${address.port}/api/does-not-exist`);
        const payload = await response.json();

        assert.equal(response.status, 404);
        assert.equal(payload.success, false);
        assert.ok(payload.meta?.requestId);
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }
    },
  },
];

let hasFailures = false;

for (const currentTest of tests) {
  try {
    await currentTest.run();
    console.log(`PASS ${currentTest.name}`);
  } catch (error) {
    hasFailures = true;
    const runtimeError = error instanceof Error ? error : new Error(String(error));
    console.error(`FAIL ${currentTest.name}`);
    console.error(runtimeError.stack ?? runtimeError.message);
  }
}

if (hasFailures) {
  process.exitCode = 1;
} else {
  console.log(`All ${tests.length} backend verification checks passed.`);
}
