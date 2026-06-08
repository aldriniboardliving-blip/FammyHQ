const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

// Upsert an announcement
router.post("/sync", (req, res) => {
  try {
    const { id, familyId, title, content, priority, createdBy, createdAt } = req.body;
    if (!id || !familyId || !title || !content) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const db = getDb();
    db.prepare(
      `INSERT INTO announcements (id, familyId, title, content, priority, createdBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = COALESCE(excluded.title, announcements.title),
         content = COALESCE(excluded.content, announcements.content),
         priority = COALESCE(excluded.priority, announcements.priority)`
    ).run(id, familyId, title, content, priority || "normal", createdBy, createdAt || new Date().toISOString());

    const announcement = db.prepare("SELECT * FROM announcements WHERE id = ?").get(id);
    res.json({ success: true, announcement });
  } catch (err) {
    console.error("POST /api/announcements/sync error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all announcements for a family
router.get("/family/:familyId", (req, res) => {
  try {
    const db = getDb();
    const announcements = db.prepare("SELECT * FROM announcements WHERE familyId = ? ORDER BY createdAt DESC").all(req.params.familyId);
    res.json({ success: true, announcements });
  } catch (err) {
    console.error("GET /api/announcements/family/:familyId error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete an announcement
router.delete("/:id", (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare("DELETE FROM announcements WHERE id = ?").run(req.params.id);
    res.json({ success: true, deleted: result.changes > 0 });
  } catch (err) {
    console.error("DELETE /api/announcements/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
