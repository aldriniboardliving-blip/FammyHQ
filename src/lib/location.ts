import { db } from "@/database/db";
import { generateId } from "@/lib/utils";

export interface LocationRecord {
  id: string;
  userId: string;
  familyId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  displayName?: string;
}

export function saveUserLocation(
  userId: string,
  familyId: string,
  latitude: number,
  longitude: number,
  accuracy: number | null
): LocationRecord {
  const id = generateId("LOC");
  const now = new Date().toISOString();
  const record: LocationRecord = { id, userId, familyId, latitude, longitude, accuracy, timestamp: now };
  db.runSync(
    `INSERT INTO locations (id, userId, familyId, latitude, longitude, accuracy, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, familyId, latitude, longitude, accuracy, now]
  );
  return record;
}

export function saveCheckIn(
  userId: string,
  familyId: string,
  latitude: number,
  longitude: number,
  locationName: string,
  note: string
): LocationRecord {
  const id = generateId("CHK");
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO check_ins (id, userId, familyId, locationName, latitude, longitude, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, familyId, locationName, latitude, longitude, note, now]
  );
  return { id, userId, familyId, latitude, longitude, accuracy: null, timestamp: now };
}

export function getFamilyLocations(familyId: string): (LocationRecord & { displayName: string })[] {
  return db.getAllSync<LocationRecord & { displayName: string }>(
    `SELECT l.*, u.displayName
     FROM locations l
     JOIN users u ON l.userId = u.id
     WHERE l.familyId = ?
       AND l.timestamp = (
         SELECT MAX(l2.timestamp) FROM locations l2 WHERE l2.userId = l.userId AND l2.familyId = l.familyId
       )
     ORDER BY l.timestamp DESC`,
    [familyId]
  );
}

export function getLatestLocation(userId: string): LocationRecord | null {
  return db.getFirstSync<LocationRecord>(
    `SELECT * FROM locations WHERE userId = ? ORDER BY timestamp DESC LIMIT 1`,
    [userId]
  );
}

export interface CheckInRecord {
  id: string;
  userId: string;
  familyId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  note: string;
  createdAt: string;
  displayName: string;
}

export function getRecentCheckIns(familyId: string, limit = 20): CheckInRecord[] {
  return db.getAllSync<any>(
    `SELECT ci.*, u.displayName
     FROM check_ins ci
     JOIN users u ON ci.userId = u.id
     WHERE ci.familyId = ?
     ORDER BY ci.createdAt DESC
     LIMIT ?`,
    [familyId, limit]
  );
}
