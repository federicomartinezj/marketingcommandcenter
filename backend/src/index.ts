import "dotenv/config";
import express from "express";
import cors from "cors";
import { contentRouter } from "./routes/content.js";
import { calendarRouter } from "./routes/calendar.js";
import { campaignRouter } from "./routes/campaigns.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "lavanti-marketing-api" });
});

app.use("/api/content", contentRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/campaigns", campaignRouter);

app.listen(PORT, () => {
  console.log(`Lavanti Marketing API running on port ${PORT}`);
});
