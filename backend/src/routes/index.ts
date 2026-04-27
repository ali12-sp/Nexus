import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { documentRouter } from "./document.routes.js";
import { meetingRouter } from "./meeting.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) =>
  sendSuccess(
    res,
    {
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    "Nexus API is healthy",
  ),
);

apiRouter.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRawUnsafe("SELECT 1");

      return sendSuccess(
        res,
        {
          status: "ready",
          timestamp: new Date().toISOString(),
        },
        "Nexus API is ready",
      );
    } catch {
      return res.status(503).json({
        success: false,
        message: "Database connectivity is unavailable",
        data: {
          status: "degraded",
          timestamp: new Date().toISOString(),
        },
        meta: {
          requestId: res.req.requestId ?? null,
        },
      });
    }
  }),
);

apiRouter.get("/metrics/runtime", (_req, res) =>
  sendSuccess(
    res,
    {
      environment: process.env.NODE_ENV ?? "development",
      memoryUsageMb: {
        heapTotal: Number((process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)),
        heapUsed: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
        rss: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2)),
      },
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
    },
    "Runtime metrics fetched successfully",
  ),
);

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/meetings", meetingRouter);
apiRouter.use("/documents", documentRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/notifications", notificationRouter);
