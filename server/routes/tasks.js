const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

// Upsert a task (create or update)
router.post("/sync", (req, res) => {
  try {
    const { id, familyId, title, description, assignedTo, createdBy, dueDate, completed, completedAt, priority, reward, visibility, status, createdAt } = req.body;
    if (!id || !familyId || !title) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const db = getDb();
    db.prepare(
      `INSERT INTO tasks (id, familyId, title, description, assignedTo, createdBy, dueDate, completed, completedAt, priority, reward, visibility, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = COALESCE(excluded.title, tasks.title),
         description = COALESCE(excluded.description, tasks.description),
         assignedTo = COALESCE(excluded.assignedTo, tasks.assignedTo),
         dueDate = COALESCE(excluded.dueDate, tasks.dueDate),
         completed = COALESCE(excluded.completed, tasks.completed),
         completedAt = COALESCE(excluded.completedAt, tasks.completedAt),
         priority = COALESCE(excluded.priority, tasks.priority),
         reward = COALESCE(excluded.reward, tasks.reward),
         visibility = COALESCE(excluded.visibility, tasks.visibility),
         status = COALESCE(excluded.status, tasks.status)`
    ).run(id, familyId, title, description || null, assignedTo || null, createdBy, dueDate || null, completed ?? 0, completedAt || null, priority || "normal", reward || null, visibility || "all", status || "pending", createdAt || new Date().toISOString());

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    res.json({ success: true, task });
  } catch (err) {
    console.error("POST /api/tasks/sync error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all tasks for a family
router.get("/family/:familyId", (req, res) => {
  try {
    const db = getDb();
    const tasks = db.prepare("SELECT * FROM tasks WHERE familyId = ? ORDER BY createdAt DESC").all(req.params.familyId);
    res.json({ success: true, tasks });
  } catch (err) {
    console.error("GET /api/tasks/family/:familyId error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a task
router.delete("/:id", (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    res.json({ success: true, deleted: result.changes > 0 });
  } catch (err) {
    console.error("DELETE /api/tasks/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
