const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

router.post("/", (req, res) => {
  try {
    const { code, ciphertext, iv, salt, familyId } = req.body;
    if (!code || !ciphertext || !iv || !salt || !familyId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: code, ciphertext, iv, salt, familyId",
      });
    }

    const db = getDb();
    db.prepare("DELETE FROM invitations WHERE code = ?").run(code);
    db.prepare(
      `INSERT INTO invitations (code, ciphertext, iv, salt, familyId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(code, ciphertext, iv, salt, familyId, new Date().toISOString());

    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/invitations error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:code", (req, res) => {
  try {
    const db = getDb();
    const invitation = db
      .prepare("SELECT * FROM invitations WHERE code = ?")
      .get(req.params.code);

    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, error: "Invitation not found or expired" });
    }

    db.prepare("DELETE FROM invitations WHERE code = ?").run(req.params.code);
    res.json({ success: true, invitation });
  } catch (err) {
    console.error("GET /api/invitations/:code error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/cleanup", (_req, res) => {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const result = db.prepare("DELETE FROM invitations WHERE createdAt < ?").run(cutoff);
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error("POST /api/invitations/cleanup error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

setInterval(() => {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const result = db.prepare("DELETE FROM invitations WHERE createdAt < ?").run(cutoff);
    if (result.changes > 0) {
      console.log(`TTL cleanup: deleted ${result.changes} expired invitations`);
    }
  } catch (err) {
    console.error("TTL cleanup error:", err);
  }
}, 60 * 60 * 1000);

module.exports = router;
