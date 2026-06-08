import { create } from 'zustand';
import { db } from '@/database/db';
import { generateId } from '@/lib/utils';

export interface User {
  id: string;
  deviceId: string;
  displayName: string;
  role: string;
  familyId: string | null;
  pin: string | null;
  biometricEnabled: number;
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserStore {
  user: User | null;
  isOnboarded: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsOnboarded: (value: boolean) => void;
  createUser: (displayName: string, role: string) => Promise<User>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isOnboarded: false,
  isLoading: true,

  setUser: (user) => set({ user }),
  setIsOnboarded: (value) => set({ isOnboarded: value }),

  createUser: async (displayName: string, role: string) => {
    const userId = generateId('USR');
    const deviceId = generateId('DEV');
    const now = new Date().toISOString();

    const user: User = {
      id: userId,
      deviceId,
      displayName,
      role,
      familyId: null,
      pin: null,
      biometricEnabled: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.runSync(
      `INSERT INTO users (id, deviceId, displayName, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, deviceId, displayName, role, now, now]
    );

    set({ user, isOnboarded: true });
    return user;
  },

  updateUser: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };

    const setClauses = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    db.runSync(
      `UPDATE users SET ${setClauses}, updatedAt = ? WHERE id = ?`,
      [...values, updatedUser.updatedAt, currentUser.id]
    );

    set({ user: updatedUser });
  },

  loadUser: async () => {
    try {
      const result = db.getFirstSync<{ id: string; deviceId: string; displayName: string; role: string; familyId: string | null; pin: string | null; biometricEnabled: number; createdAt: string; updatedAt: string }>(
        'SELECT * FROM users LIMIT 1'
      );

      if (result) {
        set({ user: result as User, isOnboarded: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },
}));
