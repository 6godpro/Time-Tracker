import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import authRoutes from "./auth/routes/auth.routes";
import shiftRoutes from "./shift/routes/shift.routes";
import breakRoutes from "./break/routes/break.routes";
import adminRoutes from "./admin/routes/admin.routes";

export const app = express();

app.use(cors({ origin: env.corsOrigin.split(','), credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/shift", shiftRoutes);
app.use("/break", breakRoutes);
app.use("/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
