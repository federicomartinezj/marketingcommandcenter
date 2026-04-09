import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// Create calendar item
router.post("/", async (req, res) => {
  const { date, channel, line, title, contentId } = req.body;

  if (!date || !channel || !line || !title) {
    res.status(400).json({ error: "Missing required fields: date, channel, line, title" });
    return;
  }

  const item = await prisma.calendarItem.create({
    data: { date, channel, line, title, contentId },
  });

  res.status(201).json({ ...item, createdAt: item.createdAt.toISOString() });
});

// Get calendar items (optionally filtered by month)
router.get("/", async (req, res) => {
  const month = req.query.month as string | undefined;
  const where = month ? { date: { startsWith: month } } : {};

  const items = await prisma.calendarItem.findMany({ where, orderBy: { date: "asc" } });
  res.json(items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })));
});

// Update calendar item
router.put("/:id", async (req, res) => {
  const existing = await prisma.calendarItem.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: "Calendar item not found" }); return; }

  const { date, channel, line, title, status, contentId } = req.body;
  const data: Record<string, string> = {};
  if (date) data.date = date;
  if (channel) data.channel = channel;
  if (line) data.line = line;
  if (title) data.title = title;
  if (status) data.status = status;
  if (contentId !== undefined) data.contentId = contentId;

  const updated = await prisma.calendarItem.update({ where: { id: req.params.id }, data });
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

// Delete calendar item
router.delete("/:id", async (req, res) => {
  const existing = await prisma.calendarItem.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: "Calendar item not found" }); return; }
  await prisma.calendarItem.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as calendarRouter };
