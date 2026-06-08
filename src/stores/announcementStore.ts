import { create } from "zustand";
import { db } from "@/database/db";
import { generateId } from "@/lib/utils";
import { enqueue } from "@/lib/outbox";
import { notifyFamilyMembers } from "@/lib/notifications";

export interface Announcement {
  id: string;
  familyId: string;
  title: string;
  content: string;
  priority: string;
  createdBy: string;
  createdAt: string;
  authorName?: string;
}

interface AnnouncementStore {
  announcements: Announcement[];
  isLoading: boolean;
  loadAnnouncements: (familyId: string) => Promise<void>;
  createAnnouncement: (data: {
    familyId: string;
    title: string;
    content: string;
    priority: string;
    createdBy: string;
  }) => Promise<Announcement>;
  updateAnnouncement: (id: string, updates: { title?: string; content?: string; priority?: string }) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

export const useAnnouncementStore = create<AnnouncementStore>((set, get) => ({
  announcements: [],
  isLoading: false,

  loadAnnouncements: async (familyId: string) => {
    try {
      set({ isLoading: true });
      const results = db.getAllSync<Announcement & { authorName: string }>(
        `SELECT a.*, u.displayName as authorName 
         FROM announcements a 
         JOIN users u ON a.createdBy = u.id 
         WHERE a.familyId = ? 
         ORDER BY a.createdAt DESC`,
        [familyId]
      );
      set({ announcements: results, isLoading: false });
    } catch (error) {
      console.error("Error loading announcements:", error);
      set({ isLoading: false });
    }
  },

  createAnnouncement: async (data) => {
    const id = generateId("ANN");
    const now = new Date().toISOString();

    const announcement: Announcement = {
      id,
      familyId: data.familyId,
      title: data.title,
      content: data.content,
      priority: data.priority,
      createdBy: data.createdBy,
      createdAt: now,
    };

    db.runSync(
      `INSERT INTO announcements (id, familyId, title, content, priority, createdBy, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.familyId, data.title, data.content, data.priority, data.createdBy, now]
    );

    enqueue("announcement", id, "create", announcement);

    // Notify all family members
    notifyFamilyMembers(
      data.familyId,
      data.createdBy,
      "New Announcement",
      data.title,
      "announcement",
      { announcementId: id, familyId: data.familyId }
    );

    set({ announcements: [announcement, ...get().announcements] });
    return announcement;
  },

  updateAnnouncement: async (id, updates) => {
    const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (!entries.length) return;

    const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
    const values = entries.map(([, v]) => v);

    db.runSync(`UPDATE announcements SET ${setClauses} WHERE id = ?`, [...values, id]);

    const announcements = get().announcements.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    set({ announcements });

    const updated = get().announcements.find((a) => a.id === id);
    if (updated) enqueue("announcement", id, "update", updated);
  },

  deleteAnnouncement: async (id) => {
    db.runSync(`DELETE FROM announcements WHERE id = ?`, [id]);
    const announcements = get().announcements.filter((a) => a.id !== id);
    set({ announcements });

    enqueue("announcement", id, "delete", { id });
  },
}));
