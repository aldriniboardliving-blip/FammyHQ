import { db } from "@/database/db";
import { generateId } from "./utils";
import {
  syncTask,
  deleteTaskRemote,
  syncAnnouncement,
  deleteAnnouncementRemote,
  syncEvent,
  deleteEventRemote,
  syncFamily,
  pushInvitation,
  approveMember,
  joinFamilyRemote,
  checkServerReachable,
} from "./api";

export type EntityType = "family" | "task" | "announcement" | "event" | "member" | "invitation";
export type Operation = "create" | "update" | "delete";

interface OutboxEntry {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: Operation;
  payload: string;
  createdAt: string;
  syncedAt: string | null;
}

/**
 * Enqueue a mutation into the sync outbox.
 * Called by stores after every local write.
 */
export function enqueue(
  entityType: EntityType,
  entityId: string,
  operation: Operation,
  payload: object,
) {
  const id = generateId("OBX");
  db.runSync(
    `INSERT INTO sync_outbox (id, entityType, entityId, operation, payload, createdAt, syncedAt)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [id, entityType, entityId, operation, JSON.stringify(payload), new Date().toISOString()],
  );
}

/**
 * Process the sync outbox — push pending entries to the server in FIFO order.
 * Returns the number of successfully processed entries.
 */
export async function processOutbox(): Promise<number> {
  const isOnline = await checkServerReachable();
  if (!isOnline) return 0;

  const pending = db.getAllSync<OutboxEntry>(
    "SELECT * FROM sync_outbox WHERE syncedAt IS NULL ORDER BY createdAt ASC LIMIT 50",
  );

  let processed = 0;
  for (const entry of pending) {
    try {
      const payload = JSON.parse(entry.payload);
      const ok = await pushToServer(entry.entityType, entry.operation, payload);
      if (ok) {
        db.runSync("UPDATE sync_outbox SET syncedAt = ? WHERE id = ?", [
          new Date().toISOString(),
          entry.id,
        ]);
        processed++;
      } else {
        console.warn(`Outbox: ${entry.entityType}/${entry.entityId} pushToServer returned false`);
      }
    } catch (err) {
      console.error(`Outbox: failed to sync ${entry.entityType}/${entry.entityId}:`, err);
    }
  }

  // Clean up synced entries older than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  db.runSync("DELETE FROM sync_outbox WHERE syncedAt IS NOT NULL AND syncedAt < ?", [cutoff]);

  return processed;
}

async function pushToServer(
  entityType: EntityType,
  operation: Operation,
  payload: any,
): Promise<boolean> {
  switch (entityType) {
    case "family": {
      if (operation === "delete") return true;
      const { ok } = await syncFamily(payload);
      return ok;
    }
    case "task": {
      if (operation === "delete") {
        const { ok } = await deleteTaskRemote(payload.id);
        return ok;
      }
      const { ok } = await syncTask(payload);
      return ok;
    }
    case "announcement": {
      if (operation === "delete") {
        const { ok } = await deleteAnnouncementRemote(payload.id);
        return ok;
      }
      const { ok } = await syncAnnouncement(payload);
      return ok;
    }
    case "event": {
      if (operation === "delete") {
        const { ok } = await deleteEventRemote(payload.id);
        return ok;
      }
      const { ok } = await syncEvent(payload);
      return ok;
    }
    case "invitation": {
      const { ok } = await pushInvitation(payload);
      return ok;
    }
    case "member": {
      if (operation === "update" && payload.status === "approved") {
        const { ok } = await approveMember(payload.familyId, payload.userId);
        return ok;
      }
      if (operation === "create") {
        const { ok } = await joinFamilyRemote(payload.familyId, payload.userId, payload.displayName || "", payload.role);
        return ok;
      }
      return false;
    }
    default:
      return false;
  }
}

/**
 * Get the count of pending (unsynced) outbox entries.
 */
export function getPendingCount(): number {
  const row = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_outbox WHERE syncedAt IS NULL",
  );
  return row?.count ?? 0;
}
