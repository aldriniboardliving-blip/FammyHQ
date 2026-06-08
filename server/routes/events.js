const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

// Upsert a calendar event
router.post("/sync", (req, res) => {
  try {
    const { id, familyId, title, description, startDate, endDate, location, eventType, createdBy, createdAt } = req.body;
    if (!id || !familyId || !title || !startDate) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const db = getDb();
    db.prepare(
      `INSERT INTO calendar_events (id, familyId, title, description, startDate, endDate, location, eventType, createdBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = COALESCE(excluded.title, calendar_events.title),
         description = COALESCE(excluded.description, calendar_events.description),
         startDate = COALESCE(excluded.startDate, calendar_events.startDate),
         endDate = COALESCE(excluded.endDate, calendar_events.endDate),
         location = COALESCE(excluded.location, calendar_events.location),
         eventType = COALESCE(excluded.eventType, calendar_events.eventType)`
    ).run(id, familyId, title, description || null, startDate, endDate || null, location || null, eventType || "general", createdBy, createdAt || new Date().toISOString());

    const event = db.prepare("SELECT * FROM calendar_events WHERE id = ?").get(id);
    res.json({ success: true, event });
  } catch (err) {
    console.error("POST /api/events/sync error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all events for a family
router.get("/family/:familyId", (req, res) => {
  try {
    const db = getDb();
    const events = db.prepare("SELECT * FROM calendar_events WHERE familyId = ? ORDER BY startDate ASC").all(req.params.familyId);
    res.json({ success: true, events });
  } catch (err) {
    console.error("GET /api/events/family/:familyId error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete an event
router.delete("/:id", (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare("DELETE FROM calendar_events WHERE id = ?").run(req.params.id);
    res.json({ success: true, deleted: result.changes > 0 });
  } catch (err) {
    console.error("DELETE /api/events/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
