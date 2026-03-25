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

// PUT /:id/status — Update content status (approve, reject, publish)
router.put("/:id/status", (req, res) => {
  const item = contentStore.get(req.params.id) as Record<string, unknown> | undefined;
  if (!item) {
    res.status(404).json({ error: "Content not found" });
    return;
  }

  const { status } = req.body;
  const validStatuses = ["draft", "in-review", "approved", "rejected", "published"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  item.status = status;
  item.updatedAt = new Date().toISOString();
  contentStore.set(req.params.id, item);
  res.json(item);
});

export { router as contentRouter };
