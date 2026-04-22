import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { documentRouter } from "./document.routes.js";
import { meetingRouter } from "./meeting.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Nexus API is healthy",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/meetings", meetingRouter);
apiRouter.use("/documents", documentRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/notifications", notificationRouter);
