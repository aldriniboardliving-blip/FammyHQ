// Server URL — change this to your deployed server address
// For local dev: your machine's LAN IP so phones can reach it
export const API_BASE_URL = "https://fammyhq-production.up.railway.app";

interface ApiResponse<T> {
  success: boolean;
  error?: string;
  [key: string]: T | boolean | string | undefined;
}

async function apiCall<T>(
  path: string,
  options?: RequestInit,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    clearTimeout(timeout);
    const json = await res.json();
    if (!res.ok || json.success === false) {
      return { ok: false, error: json.error || `HTTP ${res.status}` };
    }
    return { ok: true, data: json as T };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return { ok: false, error: "Request timed out" };
    }
    return { ok: false, error: err?.message || "Network error" };
  }
}

// ─── Families ───

export interface ApiFamily {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}

export async function syncFamily(family: {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt?: string;
  creatorName?: string;
}) {
  return apiCall<ApiResponse<ApiFamily>>("/api/families", {
    method: "POST",
    body: JSON.stringify(family),
  });
}

export async function lookupFamily(inviteCode: string) {
  return apiCall<{ success: boolean; family: ApiFamily }>(
    `/api/families/lookup/${encodeURIComponent(inviteCode)}`,
  );
}

export async function joinFamilyRemote(
  familyId: string,
  userId: string,
  displayName?: string,
  role?: string,
) {
  return apiCall<{ success: boolean; family: ApiFamily; memberId?: string }>(
    `/api/families/${encodeURIComponent(familyId)}/join`,
    {
      method: "POST",
      body: JSON.stringify({ userId, displayName, role }),
    },
  );
}

export async function getFamilyMembers(familyId: string) {
  return apiCall<{ success: boolean; members: any[] }>(
    `/api/families/${encodeURIComponent(familyId)}/members`,
  );
}

export async function approveMember(familyId: string, memberId: string) {
  return apiCall<{ success: boolean; member: any }>(
    `/api/families/${encodeURIComponent(familyId)}/approve/${encodeURIComponent(memberId)}`,
    { method: "POST" },
  );
}

// ─── Tasks ───

export async function syncTask(task: {
  id: string;
  familyId: string;
  title: string;
  description?: string | null;
  assignedTo?: string | null;
  createdBy: string;
  dueDate?: string | null;
  completed?: number;
  completedAt?: string | null;
  priority?: string;
  reward?: string | null;
  visibility?: string;
  status?: string;
  createdAt?: string;
}) {
  return apiCall<{ success: boolean; task: any }>("/api/tasks/sync", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function getFamilyTasks(familyId: string) {
  return apiCall<{ success: boolean; tasks: any[] }>(
    `/api/tasks/family/${encodeURIComponent(familyId)}`,
  );
}

export async function deleteTaskRemote(taskId: string) {
  return apiCall<{ success: boolean; deleted: boolean }>(
    `/api/tasks/${encodeURIComponent(taskId)}`,
    { method: "DELETE" },
  );
}

// ─── Announcements ───

export async function syncAnnouncement(announcement: {
  id: string;
  familyId: string;
  title: string;
  content: string;
  priority?: string;
  createdBy: string;
  createdAt?: string;
}) {
  return apiCall<{ success: boolean; announcement: any }>(
    "/api/announcements/sync",
    {
      method: "POST",
      body: JSON.stringify(announcement),
    },
  );
}

export async function getFamilyAnnouncements(familyId: string) {
  return apiCall<{ success: boolean; announcements: any[] }>(
    `/api/announcements/family/${encodeURIComponent(familyId)}`,
  );
}

export async function deleteAnnouncementRemote(announcementId: string) {
  return apiCall<{ success: boolean; deleted: boolean }>(
    `/api/announcements/${encodeURIComponent(announcementId)}`,
    { method: "DELETE" },
  );
}

// ─── Calendar Events ───

export async function syncEvent(event: {
  id: string;
  familyId: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  eventType?: string;
  createdBy: string;
  createdAt?: string;
}) {
  return apiCall<{ success: boolean; event: any }>("/api/events/sync", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export async function getFamilyEvents(familyId: string) {
  return apiCall<{ success: boolean; events: any[] }>(
    `/api/events/family/${encodeURIComponent(familyId)}`,
  );
}

export async function deleteEventRemote(eventId: string) {
  return apiCall<{ success: boolean; deleted: boolean }>(
    `/api/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );
}

// ─── Invitations (Encrypted Relay) ───

export async function pushInvitation(data: {
  code: string;
  ciphertext: string;
  iv: string;
  salt: string;
  familyId: string;
}) {
  return apiCall<{ success: boolean }>("/api/invitations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function pullInvitation(code: string) {
  return apiCall<{
    success: boolean;
    invitation: {
      code: string;
      ciphertext: string;
      iv: string;
      salt: string;
      familyId: string;
    };
  }>(`/api/invitations/${encodeURIComponent(code)}`);
}

// ─── Connectivity ───

export async function checkServerReachable(): Promise<boolean> {
  const { ok } = await apiCall<{ status: string }>("/api/health");
  return ok;
}
