import { create } from "zustand";
import { db } from "@/database/db";
import { generateId } from "@/lib/utils";
import { enqueue } from "@/lib/outbox";

export interface CalendarEvent {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  eventType: string;
  createdBy: string;
  createdAt: string;
  source?: string;
  sourceId?: string;
  status?: string;
}

interface CalendarStore {
  events: CalendarEvent[];
  isLoading: boolean;
  loadEvents: (familyId: string) => Promise<void>;
  loadAllCalendarItems: (familyId: string) => Promise<CalendarEvent[]>;
  createEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => Promise<CalendarEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  isLoading: false,

  loadEvents: async (familyId: string) => {
    try {
      set({ isLoading: true });
      const results = db.getAllSync<CalendarEvent>(
        `SELECT * FROM calendar_events 
         WHERE familyId = ? 
         ORDER BY startDate ASC`,
        [familyId]
      );
      set({ events: results, isLoading: false });
    } catch (error) {
      console.error("Error loading events:", error);
      set({ isLoading: false });
    }
  },

  loadAllCalendarItems: async (familyId: string) => {
    const calendarEvents = db.getAllSync<CalendarEvent>(
      `SELECT *, 'event' as source, id as sourceId FROM calendar_events 
       WHERE familyId = ? 
       ORDER BY startDate ASC`,
      [familyId]
    );

    const taskDueDates = db.getAllSync<CalendarEvent>(
      `SELECT 
        t.id as id,
        t.familyId as familyId,
        t.title as title,
        t.description as description,
        t.dueDate as startDate,
        NULL as endDate,
        NULL as location,
        'task' as eventType,
        t.createdBy as createdBy,
        t.createdAt as createdAt,
        'task' as source,
        t.id as sourceId,
        t.status as status
       FROM tasks t 
       WHERE t.familyId = ? AND t.dueDate IS NOT NULL AND t.completed = 0
       ORDER BY t.dueDate ASC`,
      [familyId]
    );

    const all = [...calendarEvents, ...taskDueDates];
    all.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    set({ events: all });
    return all;
  },

  createEvent: async (eventData) => {
    const eventId = generateId("EVT");
    const now = new Date().toISOString();

    const event: CalendarEvent = {
      ...eventData,
      id: eventId,
      createdAt: now,
    };

    db.runSync(
      `INSERT INTO calendar_events (id, familyId, title, description, startDate, endDate, location, eventType, createdBy, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [eventId, eventData.familyId, eventData.title, eventData.description, eventData.startDate, eventData.endDate, eventData.location, eventData.eventType, eventData.createdBy, now]
    );

    set({ events: [...get().events, event] });

    enqueue("event", eventId, "create", event);
    return event;
  },

  deleteEvent: async (eventId) => {
    db.runSync(`DELETE FROM calendar_events WHERE id = ?`, [eventId]);
    const events = get().events.filter((e) => e.id !== eventId);
    set({ events });

    enqueue("event", eventId, "delete", { id: eventId });
  },
}));
