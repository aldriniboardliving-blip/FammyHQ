import { db } from "./db";

export const initDatabase = async () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      deviceId TEXT,
      displayName TEXT,
      role TEXT,
      familyId TEXT,
      pin TEXT,
      biometricEnabled INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT,
      inviteCode TEXT,
      createdBy TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id TEXT PRIMARY KEY,
      familyId TEXT,
      userId TEXT,
      role TEXT,
      status TEXT DEFAULT 'pending',
      joinedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (familyId) REFERENCES families(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      familyId TEXT,
      code TEXT,
      qrData TEXT,
      createdBy TEXT,
      status TEXT DEFAULT 'active',
      expiresAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (familyId) REFERENCES families(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      familyId TEXT,
      title TEXT,
      content TEXT,
      priority TEXT DEFAULT 'normal',
      createdBy TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (familyId) REFERENCES families(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      familyId TEXT,
      title TEXT,
      description TEXT,
      assignedTo TEXT,
      createdBy TEXT,
      dueDate TEXT,
      completed INTEGER DEFAULT 0,
      completedAt TEXT,
      priority TEXT DEFAULT 'normal',
      reward TEXT,
      visibility TEXT DEFAULT 'all',
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (familyId) REFERENCES families(id),
      FOREIGN KEY (assignedTo) REFERENCES users(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      familyId TEXT,
      title TEXT,
      description TEXT,
      startDate TEXT,
      endDate TEXT,
      location TEXT,
      eventType TEXT DEFAULT 'event',
      createdBy TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (familyId) REFERENCES families(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      familyId TEXT,
      senderId TEXT,
      message TEXT,
      messageType TEXT DEFAULT 'text',
      mediaUrl TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (familyId) REFERENCES families(id),
      FOREIGN KEY (senderId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      userId TEXT,
      familyId TEXT,
      latitude REAL,
      longitude REAL,
      accuracy REAL,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (familyId) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      userId TEXT,
      familyId TEXT,
      locationName TEXT,
      latitude REAL,
      longitude REAL,
      note TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (familyId) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT,
      body TEXT,
      type TEXT,
      data TEXT,
      read INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      userId TEXT,
      key TEXT,
      value TEXT,
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Migration: add columns that may not exist on older schemas
  try { db.runSync(`ALTER TABLE tasks ADD COLUMN visibility TEXT DEFAULT 'all'`); } catch {}
  try { db.runSync(`ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'pending'`); } catch {}
  try { db.runSync(`ALTER TABLE families ADD COLUMN photoUri TEXT`); } catch {}
  try { db.runSync(`ALTER TABLE users ADD COLUMN photoUri TEXT`); } catch {}

  // Sync outbox — every mutation gets queued here before publishing to server
  db.runSync(`
    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      syncedAt TEXT
    )
  `);

  // Pending invites — saved locally when joining offline, retried on reconnect
  db.runSync(`
    CREATE TABLE IF NOT EXISTS pending_invites (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
};
