import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth.js";
import workOrdersRouter from "./routes/workOrders.js";

const app = express();
app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigin && corsOrigin.length ? corsOrigin : false, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth", authLimiter);

app.get("/health", (_req, res) => res.json({ ok: true, service: "mes-g-api" }));

app.use("/api/auth", authRouter);
app.use("/api/work-orders", workOrdersRouter);

app.use((_req, res) => res.status(404).json({ error: "Bulunamadı" }));

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`MES-G API listening on ${port}`));
