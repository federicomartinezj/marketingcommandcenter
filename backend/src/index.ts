import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "lavanti-marketing-api" });
});

app.listen(PORT, () => {
  console.log(`Lavanti Marketing API running on port ${PORT}`);
});
