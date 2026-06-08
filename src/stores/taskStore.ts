import { create } from "zustand";
import { db } from "@/database/db";
import { generateId } from "@/lib/utils";
import { enqueue } from "@/lib/outbox";
import { createNotification, notifyFamilyMembers } from "@/lib/notifications";

export interface Task {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  createdBy: string;
  dueDate: string | null;
  completed: number;
  completedAt: string | null;
  priority: string;
  reward: string | null;
  visibility: string;
  status: string;
  createdAt: string;
  assigneeName?: string;
  creatorName?: string;
}

export type TaskStatus = "pending" | "ongoing" | "completed";
export type TaskVisibility = "all" | "personal";

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  loadTasks: (familyId: string) => Promise<void>;
  createTask: (task: {
    familyId: string;
    title: string;
    description?: string;
    assignedTo?: string;
    createdBy: string;
    dueDate?: string;
    priority?: string;
    reward?: string;
    visibility?: string;
  }) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus, userId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,

  loadTasks: async (familyId: string) => {
    try {
      set({ isLoading: true });
      const results = db.getAllSync<Task & { assigneeName: string; creatorName: string }>(
        `SELECT t.*, 
                u.displayName as assigneeName, 
                uc.displayName as creatorName
         FROM tasks t 
         LEFT JOIN users u ON t.assignedTo = u.id 
         LEFT JOIN users uc ON t.createdBy = uc.id 
         WHERE t.familyId = ? 
         ORDER BY t.dueDate ASC`,
        [familyId]
      );
      set({ tasks: results, isLoading: false });
    } catch (error) {
      console.error("Error loading tasks:", error);
      set({ isLoading: false });
    }
  },

  createTask: async (taskData) => {
    const taskId = generateId("TSK");
    const now = new Date().toISOString();

    const task: Task = {
      id: taskId,
      familyId: taskData.familyId,
      title: taskData.title,
      description: taskData.description ?? null,
      assignedTo: taskData.assignedTo ?? null,
      createdBy: taskData.createdBy,
      dueDate: taskData.dueDate ?? null,
      completed: 0,
      completedAt: null,
      priority: taskData.priority ?? "normal",
      reward: taskData.reward ?? null,
      visibility: taskData.visibility ?? "all",
      status: "pending",
      createdAt: now,
    };

    db.runSync(
      `INSERT INTO tasks (id, familyId, title, description, assignedTo, createdBy, dueDate, completed, priority, reward, visibility, status, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [taskId, taskData.familyId, taskData.title, taskData.description ?? null, taskData.assignedTo ?? null, taskData.createdBy, taskData.dueDate ?? null, 0, taskData.priority ?? "normal", taskData.reward ?? null, taskData.visibility ?? "all", "pending", now]
    );

    enqueue("task", taskId, "create", task);

    // Notifications
    if (taskData.assignedTo && taskData.assignedTo !== taskData.createdBy) {
      createNotification(
        taskData.assignedTo,
        "New Task Assigned",
        `You've been assigned: "${taskData.title}"`,
        "task_assigned",
        { taskId, familyId: taskData.familyId }
      );
    }

    if (taskData.visibility === "all") {
      notifyFamilyMembers(
        taskData.familyId,
        taskData.createdBy,
        "New Task",
        `${taskData.title} has been created`,
        "task_created",
        { taskId, familyId: taskData.familyId }
      );
    }

    set({ tasks: [...get().tasks, task] });
    return task;
  },

  updateTask: async (taskId, updates) => {
    const allowed = ["title", "description", "assignedTo", "dueDate", "priority", "reward", "visibility", "status"];
    const entries = Object.entries(updates).filter(([k]) => allowed.includes(k));
    if (!entries.length) return;

    const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
    const values = entries.map(([, v]) => v ?? null);

    db.runSync(`UPDATE tasks SET ${setClauses} WHERE id = ?`, [...values, taskId]);

    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    set({ tasks });

    const updated = get().tasks.find((t) => t.id === taskId);
    if (updated) enqueue("task", taskId, "update", updated);
  },

  updateTaskStatus: async (taskId, status, userId) => {
    const now = new Date().toISOString();
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const completed = status === "completed" ? 1 : 0;
    const completedAt = status === "completed" ? now : null;

    db.runSync(
      `UPDATE tasks SET status = ?, completed = ?, completedAt = ? WHERE id = ?`,
      [status, completed, completedAt, taskId]
    );

    const updated = get().tasks.find((t) => t.id === taskId);
    if (updated) enqueue("task", taskId, "update", updated);

    // Notify creator
    if (task.createdBy && task.createdBy !== userId) {
      const statusLabel = status === "completed" ? "completed" : "marked as ongoing";
      createNotification(
        task.createdBy,
        "Task Status Updated",
        `"${task.title}" was ${statusLabel} by a family member`,
        "task_status",
        { taskId, familyId: task.familyId, status }
      );
    }

    // Notify assignee if they didn't make the change
    if (task.assignedTo && task.assignedTo !== userId && task.assignedTo !== task.createdBy) {
      const statusLabel = status === "completed" ? "completed" : "marked as ongoing";
      createNotification(
        task.assignedTo,
        "Task Status Updated",
        `"${task.title}" was ${statusLabel}`,
        "task_status",
        { taskId, familyId: task.familyId, status }
      );
    }

    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, status, completed, completedAt } : t
    );
    set({ tasks });
  },

  deleteTask: async (taskId) => {
    db.runSync(`DELETE FROM tasks WHERE id = ?`, [taskId]);
    const tasks = get().tasks.filter((t) => t.id !== taskId);
    set({ tasks });

    enqueue("task", taskId, "delete", { id: taskId });
  },
}));
