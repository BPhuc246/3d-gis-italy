import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import assetsRouter from "./routes/assets";
import destinationsRouter from "./routes/destinations";
import toursRouter from "./routes/tours";
import regionsRouter from "./routes/regions";
import routesRouter from "./routes/routes";

export function createApp() {
  const app = express();

  const origins = new Set([env.FRONTEND_URL]);
  if (env.NODE_ENV !== "production") {
    const frontend = new URL(env.FRONTEND_URL);
    if (frontend.hostname === "localhost" || frontend.hostname === "127.0.0.1") {
      frontend.hostname = frontend.hostname === "localhost" ? "127.0.0.1" : "localhost";
      origins.add(frontend.origin);
    }
  }
  app.use(cors({ origin: [...origins], credentials: true }));
  app.use(express.json({ limit: "100kb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/me", meRouter);
  app.use("/api/assets", assetsRouter);
  app.use("/api/destinations", destinationsRouter);
  app.use("/api/regions", regionsRouter);
  app.use("/api/routes", routesRouter);
  // /api/tours và /api/destinations/:slug/tour
  app.use("/api", toursRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: "Không tìm thấy đường dẫn" });
  });

  app.use(
    (
      err: Error & { status?: number; statusCode?: number },
      _req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      if (res.headersSent) return next(err);
      const status = err.status ?? err.statusCode ?? 500;
      if (status >= 500) console.error(err);
      const message =
        status === 413
          ? "Dữ liệu gửi lên quá lớn"
          : status >= 500
            ? "Lỗi máy chủ"
            : "Dữ liệu gửi lên không hợp lệ";
      res.status(status).json({ message });
    },
  );

  return app;
}
