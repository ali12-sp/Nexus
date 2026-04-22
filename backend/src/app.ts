import path from "node:path";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { openApiDocument } from "./docs/openapi.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { apiRouter } from "./routes/index.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(hpp());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
