import { Router } from "express";
import { randomUUID } from "crypto";

interface CalendarItem {
  id: string;
  date: string;         // YYYY-MM-DD
  channel: string;      // linkedin, instagram, facebook, blog, email
  line: string;         // OPL, AAS, MH, Volta
  title: string;
  status: "planned" | "created" | "published";
  contentId?: string;   // optional link to generated content
  createdAt: string;
}

const router = Router();
const calendarStore: Map<string, CalendarItem> = new Map();

// Create calendar item
router.post("/", (req, res) => {
  const { date, channel, line, title, contentId } = req.body;

  if (!date || !channel || !line || !title) {
    res.status(400).json({ error: "Missing required fields: date, channel, line, title" });
    return;
  }

  const item: CalendarItem = {
    id: randomUUID(),
    date,
    channel,
    line,
    title,
    status: "planned",
    contentId,
    createdAt: new Date().toISOString(),
  };

  calendarStore.set(item.id, item);
  res.status(201).json(item);
});

// Get calendar items (optionally filtered by month)
router.get("/", (req, res) => {
  const month = req.query.month as string | undefined; // YYYY-MM
  let items = Array.from(calendarStore.values());

  if (month) {
    items = items.filter((item) => item.date.startsWith(month));
  }

  // Sort by date
  items.sort((a, b) => a.date.localeCompare(b.date));
  res.json(items);
});

// Update calendar item
router.put("/:id", (req, res) => {
  const item = calendarStore.get(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Calendar item not found" });
    return;
  }

  const { date, channel, line, title, status, contentId } = req.body;
  if (date) item.date = date;
  if (channel) item.channel = channel;
  if (line) item.line = line;
  if (title) item.title = title;
  if (status) item.status = status;
  if (contentId !== undefined) item.contentId = contentId;

  calendarStore.set(item.id, item);
  res.json(item);
});

// Delete calendar item
router.delete("/:id", (req, res) => {
  if (!calendarStore.has(req.params.id)) {
    res.status(404).json({ error: "Calendar item not found" });
    return;
  }
  calendarStore.delete(req.params.id);
  res.status(204).send();
});

export { router as calendarRouter };
