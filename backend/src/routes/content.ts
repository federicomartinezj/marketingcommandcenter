import { Router } from "express";
import { orchestrateContentCreation } from "../agents/orchestrator.js";
import type { CreateContentRequest } from "../../shared/types.js";
import { prisma } from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const request = req.body as CreateContentRequest;

    if (!request.type || !request.line || !request.audience || !request.topic) {
      res.status(400).json({ error: "Missing required fields: type, line, audience, topic" });
      return;
    }

    const result = await orchestrateContentCreation(request);

    await prisma.content.create({
      data: {
        id: result.id,
        type: result.type || request.type,
        title: result.title || "",
        line: result.line || request.line,
        audience: result.audience || request.audience,
        status: result.status || "draft",
        content: result.content || "",
        designHtml: result.designHtml,
        brandReview: result.brandReview ? (result.brandReview as any) : undefined,
        agentsInvolved: (result.agentsInvolved || []) as any,
        plan: result.plan ? (result.plan as any) : undefined,
      },
    });

    res.json(result);
  } catch (error) {
    console.error("Content creation error:", error);
    res.status(500).json({ error: "Failed to create content" });
  }
});

router.get("/", async (_req, res) => {
  const items = await prisma.content.findMany({ orderBy: { createdAt: "desc" } });
  res.json(items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString() })));
});

router.get("/:id", async (req, res) => {
  const item = await prisma.content.findUnique({ where: { id: req.params.id } });
  if (!item) { res.status(404).json({ error: "Content not found" }); return; }
  res.json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

// PUT /:id/status — Update content status (approve, reject, publish)
router.put("/:id/status", async (req, res) => {
  const item = await prisma.content.findUnique({ where: { id: req.params.id } });
  if (!item) { res.status(404).json({ error: "Content not found" }); return; }

  const { status } = req.body;
  const validStatuses = ["draft", "in-review", "approved", "rejected", "published"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  const updated = await prisma.content.update({ where: { id: req.params.id }, data: { status } });
  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
});

export { router as contentRouter };
