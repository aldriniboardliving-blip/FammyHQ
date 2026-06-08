const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.db");

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      inviteCode TEXT UNIQUE NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      userId TEXT NOT NULL,
      displayName TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      status TEXT NOT NULL DEFAULT 'pending',
      joinedAt TEXT NOT NULL,
      FOREIGN KEY (familyId) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS pending_joins (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      userId TEXT NOT NULL,
      displayName TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (familyId) REFERENCES families(id)
    );

    CREATE INDEX IF NOT EXISTS idx_families_invite ON families(inviteCode);
    CREATE INDEX IF NOT EXISTS idx_members_family ON family_members(familyId);
    CREATE INDEX IF NOT EXISTS idx_members_user ON family_members(userId);

    CREATE TABLE IF NOT EXISTS invitations (
      code TEXT PRIMARY KEY,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      salt TEXT NOT NULL,
      familyId TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
    CREATE INDEX IF NOT EXISTS idx_invitations_created ON invitations(createdAt);

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assignedTo TEXT,
      createdBy TEXT NOT NULL,
      dueDate TEXT,
      completed INTEGER DEFAULT 0,
      completedAt TEXT,
      priority TEXT DEFAULT 'normal',
      reward TEXT,
      visibility TEXT DEFAULT 'all',
      status TEXT DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (familyId) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (familyId) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT,
      location TEXT,
      eventType TEXT DEFAULT 'general',
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (familyId) REFERENCES families(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_family ON tasks(familyId);
    CREATE INDEX IF NOT EXISTS idx_announcements_family ON announcements(familyId);
    CREATE INDEX IF NOT EXISTS idx_events_family ON calendar_events(familyId);
  `);
}

module.exports = { getDb };
