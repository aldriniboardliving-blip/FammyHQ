import {
  getFamilyMembers,
  getFamilyTasks,
  getFamilyAnnouncements,
  getFamilyEvents,
  pullInvitation,
  joinFamilyRemote,
  checkServerReachable,
} from "./api";
import { db } from "@/database/db";
import { useFamilyStore } from "@/stores/familyStore";
import { useUserStore } from "@/stores/userStore";
import { useTaskStore } from "@/stores/taskStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { generateId } from "./utils";
import { processOutbox } from "./outbox";
import { decryptPayload } from "./crypto";

let isOnline = false;
let listeners: ((online: boolean) => void)[] = [];

export function onConnectivityChange(cb: (online: boolean) => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function notifyListeners(online: boolean) {
  for (const cb of listeners) cb(online);
}

export async function checkConnectivity(): Promise<boolean> {
  const reachable = await checkServerReachable();
  if (reachable !== isOnline) {
    isOnline = reachable;
    notifyListeners(isOnline);
  }
  return isOnline;
}

export function getIsOnline() {
  return isOnline;
}

/**
 * Save a remote family to the local SQLite database so the device
 * can use it offline. Creates the family + member records locally.
 */
export function saveRemoteFamilyLocally(remote: {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}, userId: string, memberRole: string) {
  const now = new Date().toISOString();

  const existing = db.getFirstSync<{ id: string }>(
    "SELECT id FROM families WHERE id = ?",
    [remote.id],
  );
  if (!existing) {
    db.runSync(
      "INSERT INTO families (id, name, inviteCode, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
      [remote.id, remote.name, remote.inviteCode, remote.createdBy, remote.createdAt, now],
    );
  }

  const memberExists = db.getFirstSync<{ id: string }>(
    "SELECT id FROM family_members WHERE familyId = ? AND userId = ?",
    [remote.id, userId],
  );
  if (!memberExists) {
    const memberId = generateId("MEM");
    db.runSync(
      "INSERT INTO family_members (id, familyId, userId, role, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?)",
      [memberId, remote.id, userId, memberRole, "pending", now],
    );
  }

  db.runSync("UPDATE users SET familyId = ?, updatedAt = ? WHERE id = ?", [
    remote.id,
    now,
    userId,
  ]);

  const currentUser = useUserStore.getState().user;
  if (currentUser) {
    useUserStore.getState().setUser({ ...currentUser, familyId: remote.id });
  }
  useFamilyStore.getState().setFamily(remote as any);
}

// ─── Pending Invite Retry ───

async function processPendingInvites() {
  const pending = db.getAllSync<{ id: string; code: string; userId: string; role: string }>(
    "SELECT * FROM pending_invites",
  );
  if (!pending.length) return;

  for (const item of pending) {
    try {
      const { ok, data } = await pullInvitation(item.code);
      if (!ok || !data?.invitation) continue;

      const decrypted = decryptPayload<{
        familyId: string;
        name: string;
        inviteCode: string;
        createdBy: string;
        createdAt: string;
      }>(data.invitation.ciphertext, data.invitation.iv, data.invitation.salt, item.code);

      saveRemoteFamilyLocally({ ...decrypted, id: decrypted.familyId }, item.userId, item.role);

      // Register on server (best-effort)
      try {
        await joinFamilyRemote(decrypted.familyId, item.userId, "", item.role);
      } catch (e) {
        console.error("Pending invite joinFamilyRemote failed:", e);
      }

      // Remove from pending invites
      db.runSync("DELETE FROM pending_invites WHERE id = ?", [item.id]);

      // Refresh family from local DB
      const family = db.getFirstSync<any>("SELECT * FROM families WHERE id = ?", [decrypted.familyId]);
      if (family) useFamilyStore.getState().setFamily(family);
    } catch (err) {
      console.error("Pending invite retry failed:", err);
    }
  }
}

// ─── Background Sync ───

let pullTimer: ReturnType<typeof setInterval> | null = null;
let checkTimer: ReturnType<typeof setInterval> | null = null;

export function startBackgroundSync(pullIntervalMs = 10000, checkIntervalMs = 10000) {
  stopBackgroundSync();

  checkTimer = setInterval(async () => {
    await checkConnectivity();
  }, checkIntervalMs);

  pullTimer = setInterval(async () => {
    try {
      // Update connectivity state (doesn't block processing)
      await checkConnectivity();

      // 1. Push local changes to server (has own connectivity check)
      await processOutbox();

      // 2. Process any saved pending invites
      await processPendingInvites();

      // 3. Pull remote data from other devices
      await pullRemoteData();
    } catch (err) {
      console.error('Background sync tick error:', err);
    }
  }, pullIntervalMs);
}

export function stopBackgroundSync() {
  if (pullTimer) {
    clearInterval(pullTimer);
    pullTimer = null;
  }
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}

async function pullRemoteData() {
  try {
    const { family, loadMembers } = useFamilyStore.getState();
    const { user } = useUserStore.getState();
    if (!family || !user) return;

    // Sync all server members into local DB
    try {
      const { ok, data } = await getFamilyMembers(family.id);
      if (ok && data?.members) {
        for (const m of data.members) {
          const existing = db.getFirstSync<{ id: string }>(
            "SELECT id FROM family_members WHERE userId = ? AND familyId = ?",
            [m.userId, family.id],
          );
          if (!existing) {
            db.runSync(
              `INSERT INTO family_members (id, familyId, userId, displayName, role, status, joinedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [m.id, m.familyId, m.userId, m.displayName ?? "", m.role, m.status, m.joinedAt ?? new Date().toISOString()],
            );
          } else if (m.status === "approved" && existing) {
            db.runSync(
              "UPDATE family_members SET status = ? WHERE userId = ? AND familyId = ?",
              ["approved", m.userId, family.id],
            );
          }
        }
        await loadMembers(family.id);

        // Check if the current user's status changed (e.g., pending → approved)
        const myMember = db.getFirstSync<{ status: string }>(
          "SELECT status FROM family_members WHERE userId = ? AND familyId = ?",
          [user.id, family.id],
        );
        if (myMember) {
          const status = myMember.status as 'approved' | 'pending';
          const currentStatus = useFamilyStore.getState().memberStatus;
          if (currentStatus !== status) {
            useFamilyStore.setState({ memberStatus: status });
          }
        }
      }
    } catch (err) {
      console.error('Error syncing family members:', err);
    }

    // Pull data from other devices (each guarded so one failure doesn't block the others)
    await Promise.allSettled([
      pullTasks(family.id),
      pullAnnouncements(family.id),
      pullEvents(family.id),
    ]);
  } catch (err) {
    console.error('pullRemoteData error:', err);
  }
}

async function pullTasks(familyId: string) {
  try {
    const { ok, data } = await getFamilyTasks(familyId);
    if (!ok || !data?.tasks) return;
    for (const t of data.tasks) {
      const existing = db.getFirstSync<{ id: string }>(
        "SELECT id FROM tasks WHERE id = ?", [t.id],
      );
      if (!existing) {
        db.runSync(
          `INSERT INTO tasks (id, familyId, title, description, assignedTo, createdBy, dueDate, completed, completedAt, priority, reward, visibility, status, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.familyId, t.title, t.description, t.assignedTo, t.createdBy, t.dueDate, t.completed ?? 0, t.completedAt, t.priority, t.reward, t.visibility, t.status, t.createdAt],
        );
      } else if (t.status === "completed" && existing) {
        db.runSync(
          "UPDATE tasks SET completed = ?, status = ?, completedAt = ? WHERE id = ?",
          [1, "completed", t.completedAt, t.id],
        );
      }
    }
    await useTaskStore.getState().loadTasks(familyId);
  } catch (err) {
    console.error('pullTasks error:', err);
  }
}

async function pullAnnouncements(familyId: string) {
  try {
    const { ok, data } = await getFamilyAnnouncements(familyId);
    if (!ok || !data?.announcements) return;
    for (const a of data.announcements) {
      const existing = db.getFirstSync<{ id: string }>(
        "SELECT id FROM announcements WHERE id = ?", [a.id],
      );
      if (!existing) {
        db.runSync(
          `INSERT INTO announcements (id, familyId, title, content, priority, createdBy, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.familyId, a.title, a.content, a.priority, a.createdBy, a.createdAt],
        );
      }
    }
    await useAnnouncementStore.getState().loadAnnouncements(familyId);
  } catch (err) {
    console.error('pullAnnouncements error:', err);
  }
}

async function pullEvents(familyId: string) {
  try {
    const { ok, data } = await getFamilyEvents(familyId);
    if (!ok || !data?.events) return;
    for (const e of data.events) {
      const existing = db.getFirstSync<{ id: string }>(
        "SELECT id FROM calendar_events WHERE id = ?", [e.id],
      );
      if (!existing) {
        db.runSync(
          `INSERT INTO calendar_events (id, familyId, title, description, startDate, endDate, location, eventType, createdBy, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [e.id, e.familyId, e.title, e.description, e.startDate, e.endDate, e.location, e.eventType, e.createdBy, e.createdAt],
        );
      }
    }
    await useCalendarStore.getState().loadEvents(familyId);
  } catch (err) {
    console.error('pullEvents error:', err);
  }
}
