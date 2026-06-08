import { db } from "@/database/db";
import { generateId } from "@/lib/utils";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data: string | null;
  read: number;
  createdAt: string;
}

export function createNotification(
  userId: string,
  title: string,
  body: string,
  type: string,
  data: Record<string, string> | null = null
): AppNotification {
  const id = generateId("NOT");
  const now = new Date().toISOString();
  const notif: AppNotification = {
    id,
    userId,
    title,
    body,
    type,
    data: data ? JSON.stringify(data) : null,
    read: 0,
    createdAt: now,
  };
  db.runSync(
    `INSERT INTO notifications (id, userId, title, body, type, data, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, title, body, type, data ? JSON.stringify(data) : null, 0, now]
  );
  return notif;
}

export function notifyFamilyMembers(
  familyId: string,
  excludeUserId: string,
  title: string,
  body: string,
  type: string,
  data: Record<string, string> | null = null
) {
  const members = db.getAllSync<{ userId: string }>(
    `SELECT userId FROM family_members WHERE familyId = ? AND userId != ? AND status = 'approved'`,
    [familyId, excludeUserId]
  );
  for (const m of members) {
    createNotification(m.userId, title, body, type, data);
  }
}

export function notifySpecificUsers(
  userIds: string[],
  title: string,
  body: string,
  type: string,
  data: Record<string, string> | null = null
) {
  for (const uid of userIds) {
    createNotification(uid, title, body, type, data);
  }
}

export function getUnreadCount(userId: string): number {
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0`,
    [userId]
  );
  return row?.count ?? 0;
}

export function markAsRead(notificationId: string) {
  db.runSync(`UPDATE notifications SET read = 1 WHERE id = ?`, [notificationId]);
}

export function markAllAsRead(userId: string) {
  db.runSync(`UPDATE notifications SET read = 1 WHERE userId = ?`, [userId]);
}

export function getUserNotifications(userId: string): AppNotification[] {
  return db.getAllSync<AppNotification>(
    `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
    [userId]
  );
}
