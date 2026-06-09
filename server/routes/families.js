const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

// Create / sync a family to the server
router.post("/", (req, res) => {
  try {
    const { id, name, inviteCode, createdBy, createdAt } = req.body;
    if (!id || !name || !inviteCode || !createdBy) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM families WHERE id = ?").get(id);

    if (!existing) {
      db.prepare(
        "INSERT INTO families (id, name, inviteCode, createdBy, createdAt) VALUES (?, ?, ?, ?, ?)"
      ).run(id, name, inviteCode, createdBy, createdAt || new Date().toISOString());

      // Creator is automatically an approved member
      const memberId = "MEM-" + id.slice(-6) + "-CR";
      db.prepare(
        "INSERT INTO family_members (id, familyId, userId, displayName, role, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(memberId, id, createdBy, req.body.creatorName || "Creator", "parent", "approved", createdAt || new Date().toISOString());
    }

    const family = db.prepare("SELECT * FROM families WHERE id = ?").get(id);
    res.json({ success: true, family });
  } catch (err) {
    console.error("POST /api/families error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Look up a family by invite code
router.get("/lookup/:code", (req, res) => {
  try {
    const db = getDb();
    const family = db.prepare("SELECT * FROM families WHERE inviteCode = ?").get(req.params.code.toUpperCase());
    if (!family) {
      return res.status(404).json({ success: false, error: "Family not found with that invite code" });
    }
    res.json({ success: true, family });
  } catch (err) {
    console.error("GET /api/families/lookup/:code error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Join a family
router.post("/:id/join", (req, res) => {
  try {
    const { id } = req.params;
    const { userId, displayName, role } = req.body;
    console.log(`[JOIN] familyId=${id} userId=${userId} displayName=${displayName} role=${role}`);
    if (!userId) {
      console.log(`[JOIN] FAIL: missing userId`);
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    const db = getDb();
    const family = db.prepare("SELECT * FROM families WHERE id = ?").get(id);
    if (!family) {
      console.log(`[JOIN] FAIL: family not found id=${id}`);
      return res.status(404).json({ success: false, error: "Family not found" });
    }

    // Check if already a member
    const existing = db.prepare("SELECT id FROM family_members WHERE familyId = ? AND userId = ?").get(id, userId);
    if (existing) {
      console.log(`[JOIN] Already a member: userId=${userId}`);
      return res.json({ success: true, family, message: "Already a member" });
    }

    const memberId = "MEM-" + id.slice(-4) + "-" + userId.slice(-4);
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO family_members (id, familyId, userId, displayName, role, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(memberId, id, userId, displayName || "Member", role || "member", "pending", now);

    console.log(`[JOIN] SUCCESS: memberId=${memberId} userId=${userId}`);
    res.json({ success: true, family, memberId });
  } catch (err) {
    console.error("[JOIN] ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get family members
router.get("/:id/members", (req, res) => {
  try {
    const db = getDb();
    const members = db.prepare("SELECT * FROM family_members WHERE familyId = ?").all(req.params.id);
    console.log(`[MEMBERS] familyId=${req.params.id} count=${members.length} ids=${members.map(m => m.userId).join(",")}`);
    res.json({ success: true, members });
  } catch (err) {
    console.error("GET /api/families/:id/members error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve a pending member (by userId, not internal DB id)
router.post("/:familyId/approve/:userId", (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare("UPDATE family_members SET status = ? WHERE userId = ? AND familyId = ?")
      .run("approved", req.params.userId, req.params.familyId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "Member not found for this userId" });
    }
    const member = db.prepare("SELECT * FROM family_members WHERE userId = ? AND familyId = ?").get(req.params.userId, req.params.familyId);
    res.json({ success: true, member });
  } catch (err) {
    console.error("POST /api/families/:familyId/approve/:userId error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
