import { Router } from "express";
import { orchestrateContentCreation } from "../agents/orchestrator.js";
import type { CreateContentRequest } from "../../shared/types.js";

const router = Router();

// In-memory store for MVP
const contentStore: Map<string, unknown> = new Map();

router.post("/", async (req, res) => {
  try {
    const request = req.body as CreateContentRequest;

    if (!request.type || !request.line || !request.audience || !request.topic) {
      res.status(400).json({ error: "Missing required fields: type, line, audience, topic" });
      return;
    }

    const result = await orchestrateContentCreation(request);
    contentStore.set(result.id, result);
    res.json(result);
  } catch (error) {
    console.error("Content creation error:", error);
    res.status(500).json({ error: "Failed to create content" });
  }
});

router.get("/", (_req, res) => {
  const items = Array.from(contentStore.values());
  res.json(items);
});

router.get("/:id", (req, res) => {
  const item = contentStore.get(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Content not found" });
    return;
  }
  res.json(item);
});

export { router as contentRouter };
