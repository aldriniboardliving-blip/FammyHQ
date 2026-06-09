import { create } from 'zustand';
import { db } from '@/database/db';
import { generateId, generateInviteCode, normalizeInviteCode } from '@/lib/utils';
import { useUserStore } from './userStore';
import { enqueue, processOutbox } from '@/lib/outbox';
import { encryptPayload, decryptPayload } from '@/lib/crypto';
import { joinFamilyRemote, pullInvitation, pushInvitation } from '@/lib/api';

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  photoUri?: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  displayName?: string;
}

interface FamilyStore {
  family: Family | null;
  members: FamilyMember[];
  isLoading: boolean;
  pushStatus: 'idle' | 'pushing' | 'pushed' | 'failed';
  pushError: string;
  setFamily: (family: Family | null) => void;
  setLoading: (loading: boolean) => void;
  createFamily: (name: string, userId: string) => Promise<Family>;
  joinFamily: (inviteCode: string, userId: string, role: string) => Promise<Family>;
  loadFamily: (userId: string) => Promise<void>;
  loadMembers: (familyId: string) => Promise<void>;
  approveMember: (memberId: string) => Promise<void>;
  rejectMember: (memberId: string) => Promise<void>;
  updateFamily: (familyId: string, updates: { name?: string; photoUri?: string }) => Promise<void>;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  family: null,
  members: [],
  isLoading: true,
  pushStatus: 'idle',
  pushError: '',

  setFamily: (family) => set({ family }),
  setLoading: (loading) => set({ isLoading: loading }),

  createFamily: async (name: string, userId: string) => {
    const familyId = generateId('FAM');
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();

    const family: Family = {
      id: familyId,
      name,
      inviteCode,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    db.runSync(
      `INSERT INTO families (id, name, inviteCode, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [familyId, name, inviteCode, userId, now, now]
    );

    const memberId = generateId('MEM');
    db.runSync(
      `INSERT INTO family_members (id, familyId, userId, role, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [memberId, familyId, userId, 'parent', 'approved', now]
    );

    db.runSync(
      `UPDATE users SET familyId = ?, updatedAt = ? WHERE id = ?`,
      [familyId, now, userId]
    );

    set({ family });

    // Enqueue family for general sync (creates on server via outbox)
    enqueue('family', familyId, 'create', family);

    // Push encrypted invitation to relay server (fire-and-forget)
    set({ pushStatus: 'pushing', pushError: '' });
    try {
      const payload = { familyId, name, inviteCode, createdBy: userId, createdAt: now };
      const { ciphertext, iv, salt } = encryptPayload(payload, inviteCode);

      const inviteEntry = {
        code: inviteCode,
        ciphertext,
        iv,
        salt,
        familyId,
      };

      // Try direct push (don't block navigation)
      pushInvitation(inviteEntry).then((res) => {
        if (res.ok) {
          set({ pushStatus: 'pushed' });
        } else {
          set({ pushStatus: 'failed', pushError: res.error || 'Push returned error' });
          console.warn('Direct push failed:', res.error, '— enqueuing to outbox');
          enqueue('invitation', `inv-${familyId}`, 'create', inviteEntry);
          processOutbox().catch(() => {});
        }
      }).catch((err) => {
        set({ pushStatus: 'failed', pushError: err?.message || 'Push threw' });
        console.warn('Direct push threw:', err);
        enqueue('invitation', `inv-${familyId}`, 'create', inviteEntry);
        processOutbox().catch(() => {});
      });
    } catch (err) {
      set({ pushStatus: 'failed', pushError: err instanceof Error ? err.message : String(err) });
      console.warn('Failed to encrypt invitation:', err);
    }

    return family;
  },

  joinFamily: async (inviteCode: string, userId: string, role: string) => {
    const now = new Date().toISOString();
    const normalized = normalizeInviteCode(inviteCode);

    // Step 1: Try local SQLite lookup
    const localFamily = db.getFirstSync<Family>(
      'SELECT * FROM families WHERE inviteCode = ?',
      [normalized]
    );

    if (localFamily) {
      // Already known locally — just add member
      const memberId = generateId('MEM');
      db.runSync(
        'INSERT INTO family_members (id, familyId, userId, role, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [memberId, localFamily.id, userId, role, 'pending', now]
      );
      db.runSync('UPDATE users SET familyId = ?, updatedAt = ? WHERE id = ?', [localFamily.id, now, userId]);

      const currentUser = useUserStore.getState().user;
      if (currentUser) {
        useUserStore.getState().setUser({ ...currentUser, familyId: localFamily.id });
      }

      set({ family: localFamily });
      return localFamily;
    }

    // Step 2: Try remote invitation pull (encrypted relay)
    const pullResult = await pullInvitation(normalized);
    if (pullResult.ok && pullResult.data?.invitation) {
      // Decrypt the payload using the invite code
      const decrypted = decryptPayload<{
        familyId: string;
        name: string;
        inviteCode: string;
        createdBy: string;
        createdAt: string;
      }>(
        pullResult.data.invitation.ciphertext,
        pullResult.data.invitation.iv,
        pullResult.data.invitation.salt,
        normalized
      );

        // Save family locally (insert if not exists)
        const existing = db.getFirstSync<{ id: string }>(
          'SELECT id FROM families WHERE id = ?',
          [decrypted.familyId]
        );
        if (!existing) {
          db.runSync(
            'INSERT INTO families (id, name, inviteCode, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
            [decrypted.familyId, decrypted.name, decrypted.inviteCode, decrypted.createdBy, decrypted.createdAt, now]
          );
        }

        // Add member locally
        const memberId = generateId('MEM');
        db.runSync(
          'INSERT INTO family_members (id, familyId, userId, role, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
          [memberId, decrypted.familyId, userId, role, 'pending', now]
        );

        // Register on server (best-effort)
        joinFamilyRemote(decrypted.familyId, userId, role).catch(() => {});

        db.runSync('UPDATE users SET familyId = ?, updatedAt = ? WHERE id = ?', [decrypted.familyId, now, userId]);

        const currentUser = useUserStore.getState().user;
        if (currentUser) {
          useUserStore.getState().setUser({ ...currentUser, familyId: decrypted.familyId });
        }

        const remoteFamily: Family = {
          id: decrypted.familyId,
          name: decrypted.name,
          inviteCode: decrypted.inviteCode,
          createdBy: decrypted.createdBy,
          createdAt: decrypted.createdAt,
          updatedAt: now,
        };
        set({ family: remoteFamily });
        return remoteFamily;
      }

      // Invitation not found or server unreachable — show the error
      const reason = pullResult.error
        ? `Server error: ${pullResult.error}`
        : 'Invitation not found on server';

    // Step 3: Offline fallback — save as pending invite for retry
    const pendingId = generateId('PIN');
    db.runSync(
      'INSERT INTO pending_invites (id, code, userId, role) VALUES (?, ?, ?, ?)',
      [pendingId, normalized, userId, role]
    );

    throw new Error(`Could not find family. ${reason}. The invite will be retried automatically when connected.`);
  },

  loadFamily: async (userId: string) => {
    try {
      const memberResult = db.getFirstSync<{ familyId: string }>(
        'SELECT familyId FROM family_members WHERE userId = ? AND (status = ? OR status = ?) LIMIT 1',
        [userId, 'approved', 'pending']
      );

      if (memberResult) {
        const familyResult = db.getFirstSync<Family>(
          'SELECT * FROM families WHERE id = ?',
          [memberResult.familyId]
        );
        set({ family: familyResult || null, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading family:', error);
      set({ isLoading: false });
    }
  },

  loadMembers: async (familyId: string) => {
    try {
      const results = db.getAllSync<FamilyMember & { displayName: string }>(
        `SELECT fm.*, u.displayName 
         FROM family_members fm 
         JOIN users u ON fm.userId = u.id 
         WHERE fm.familyId = ?`,
        [familyId]
      );
      set({ members: results });
    } catch (error) {
      console.error('Error loading members:', error);
    }
  },

  approveMember: async (memberId: string) => {
    const family = get().family;
    const targetMember = get().members.find((m) => m.id === memberId);
    db.runSync(
      `UPDATE family_members SET status = 'approved' WHERE id = ?`,
      [memberId]
    );

    const members = get().members.map((m) =>
      m.id === memberId ? { ...m, status: 'approved' } : m
    );
    set({ members });

    if (family && targetMember) {
      enqueue('member', memberId, 'update', { familyId: family.id, userId: targetMember.userId, status: 'approved' });
    }
  },

  rejectMember: async (memberId: string) => {
    db.runSync(
      `DELETE FROM family_members WHERE id = ?`,
      [memberId]
    );

    const members = get().members.filter((m) => m.id !== memberId);
    set({ members });
  },

  updateFamily: async (familyId: string, updates: { name?: string; photoUri?: string }) => {
    const now = new Date().toISOString();
    const current = get().family;
    if (!current || current.id !== familyId) return;

    const sets: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      sets.push(`name = ?`);
      params.push(updates.name);
    }
    if (updates.photoUri !== undefined) {
      sets.push(`photoUri = ?`);
      params.push(updates.photoUri);
    }
    sets.push(`updatedAt = ?`);
    params.push(now);
    params.push(familyId);

    db.runSync(`UPDATE families SET ${sets.join(", ")} WHERE id = ?`, params);

    const updated = { ...current, ...updates, updatedAt: now };
    set({ family: updated });

    enqueue('family', familyId, 'update', updated);
  },
}));
