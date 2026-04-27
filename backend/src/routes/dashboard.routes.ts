import { Router } from "express";

import { getDashboardSummary } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, asyncHandler(getDashboardSummary));
