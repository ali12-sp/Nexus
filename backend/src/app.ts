import path from "node:path";

import cors from "cors";
import express, { Request } from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { openApiDocument } from "./docs/openapi.js";
import { attachRequestContext } from "./middleware/requestContext.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { apiRouter } from "./routes/index.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

  morgan.token("request-id", (req) => (req as Request).requestId ?? "-");
  morgan.token("user-id", (req) => (req as Request).user?.id ?? "anonymous");

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
  app.use(attachRequestContext);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    morgan(
      env.NODE_ENV === "production"
        ? ':request-id :remote-addr ":method :url" :status :res[content-length] - :response-time ms user=:user-id'
        : ':request-id :method :url :status :response-time ms user=:user-id',
    ),
  );
  app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
