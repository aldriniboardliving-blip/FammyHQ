import { create } from "zustand";

interface Task {
  id: string;
  title: string;
}

interface TaskStore {
  tasks: Task[];
  addTask: (task: Task) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
}));
