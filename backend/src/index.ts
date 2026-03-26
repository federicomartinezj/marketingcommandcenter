import "dotenv/config";
import express from "express";
import cors from "cors";
import { contentRouter } from "./routes/content.js";
import { calendarRouter } from "./routes/calendar.js";
import { campaignRouter } from "./routes/campaigns.js";
import { intelRouter } from "./routes/intel.js";
import { metricsRouter } from "./routes/metrics.js";
import { analyticsRouter } from "./routes/analytics.js";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean) as string[];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "lavanti-marketing-api" });
});

app.use("/api/content", contentRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/campaigns", campaignRouter);
app.use("/api/intel", intelRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/analytics", analyticsRouter);

app.listen(PORT, () => {
  console.log(`Lavanti Marketing API running on port ${PORT}`);
});
