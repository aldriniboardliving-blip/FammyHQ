import AnnouncementCarousel from "@/components/announcement-carousel";
import AnnouncementFormModal from "@/components/announcement-form-modal";
import type { TaskFormData } from "@/components/task-form-modal";
import TaskFormModal from "@/components/task-form-modal";
import { Colors } from "@/constants/theme";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useFamilyStore } from "@/stores/familyStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUserStore } from "@/stores/userStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TaskItem({ item }: { item: any }) {
  const statusIcon =
    item.status === "completed"
      ? "checkmark-circle"
      : item.status === "ongoing"
        ? "time-outline"
        : "ellipse-outline";
  const statusColor =
    item.status === "completed"
      ? Colors.light.success
      : item.status === "ongoing"
        ? Colors.light.warning
        : Colors.light.textTertiary;
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconBox, { backgroundColor: statusColor + "12" }]}>
        <Ionicons name={statusIcon} size={20} color={statusColor} />
      </View>
      <View style={styles.txBody}>
        <Text
          style={[
            styles.txName,
            item.status === "completed" && styles.txNameDone,
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={styles.txMeta}>
          {item.assigneeName || "Unassigned"}
          {item.dueDate && ` · ${new Date(item.dueDate).toLocaleDateString()}`}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: statusColor }]}>
        {item.priority === "urgent" || item.priority === "high"
          ? "!!"
          : item.priority === "low"
            ? "!"
 : ""}
      </Text>
    </View>
  );
}

function EventItem({ item }: { item: any }) {
  const d = new Date(item.startDate);
  const isTask = item.source === "task";
  return (
    <View style={styles.txRow}>
      <View
        style={[
          styles.txIconBox,
          {
            backgroundColor: isTask
              ? Colors.light.accentLight
              : Colors.light.primaryLight,
          },
        ]}
      >
        <Text style={styles.txDateDay}>{d.getDate()}</Text>
        <Text style={styles.txDateMon}>
          {d.toLocaleString("default", { month: "short" })}
        </Text>
      </View>
      <View style={styles.txBody}>
        <Text style={styles.txName} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.txMeta}>
          {isTask ? "Task" : item.location || "Event"}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={Colors.light.textTertiary}
      />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUserStore();
  const { family, members } = useFamilyStore();
  const { tasks, loadTasks, createTask, updateTaskStatus } = useTaskStore();
  const { events, loadEvents } = useCalendarStore();
  const {
    announcements,
    loadAnnouncements,
    createAnnouncement,
  } = useAnnouncementStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [announceFormKey, setAnnounceFormKey] = useState(0);

  useEffect(() => {
    if (family?.id) {
      loadTasks(family.id);
      loadEvents(family.id);
      loadAnnouncements(family.id);
    }
  }, [family?.id, loadTasks, loadEvents, loadAnnouncements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (family?.id) {
      await Promise.all([
        loadTasks(family.id),
        loadEvents(family.id),
        loadAnnouncements(family.id),
      ]);
    }
    setRefreshing(false);
  }, [family, loadTasks, loadEvents, loadAnnouncements]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const visibleTasks = tasks.filter(
    (t: any) =>
      t.visibility === "all" ||
      t.createdBy === user?.id ||
      t.assignedTo === user?.id,
  );
  const pendingCount = visibleTasks.filter(
    (t: any) => t.status !== "completed",
  ).length;
  const doneCount = visibleTasks.filter(
    (t: any) => t.status === "completed",
  ).length;
  const todayTasks = visibleTasks.filter(
    (t: any) =>
      new Date().toISOString().split("T")[0] === t.dueDate?.split("T")[0],
  );
  const upcomingEvents = events
    .filter((e: any) => new Date(e.startDate) >= new Date())
    .slice(0, 5);
  const approvedMembers = members.filter((m: any) => m.status === "approved");
  const notifCount = announcements.length;
  const homeAnnouncements = announcements.slice(0, 6);

  const handleTaskToggle = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !user?.id) return;
      if (task.status === "completed") return;
      const nextStatus =
        task.status === "ongoing" ? "completed" : "ongoing";
      await updateTaskStatus(taskId, nextStatus as any, user.id);
    },
    [tasks, user, updateTaskStatus],
  );

  const handleCreateTask = useCallback(
    async (data: TaskFormData) => {
      if (!family?.id || !user?.id) return;
      await createTask({
        familyId: family.id,
        title: data.title,
        description: data.description || undefined,
        assignedTo: data.assignedTo || undefined,
        createdBy: user.id,
        dueDate: data.dueDate || undefined,
        priority: data.priority,
        reward: data.reward || undefined,
        visibility: data.visibility,
      });
    },
    [family, user, createTask],
  );

  const handleCreateAnnouncement = useCallback(
    async (data: { title: string; content: string; priority: string }) => {
      if (!family?.id || !user?.id) return;
      await createAnnouncement({
        familyId: family.id,
        title: data.title,
        content: data.content,
        priority: data.priority,
        createdBy: user.id,
      });
    },
    [family, user, createAnnouncement],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* ─── Top Bar ─── */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topGreeting}>{greeting}</Text>
            <Text style={styles.topName}>
              {user?.displayName || "Family Member"}
            </Text>
          </View>
          <View style={styles.topRight}>
            {family && (
              <View style={styles.topFamilyTag}>
                <Ionicons
                  name="home-outline"
                  size={12}
                  color={Colors.light.primary}
                />
                <Text style={styles.topFamilyText}>{family.name}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.topNotifBtn}
              onPress={() => {
                if (announcements.length > 0) router.push("/announcements");
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Colors.light.text}
              />
              {notifCount > 0 && (
                <View style={styles.topNotifDot} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Hero Card ─── */}
        <View style={styles.heroCard}>
          <View style={styles.heroLabelRow}>
            <Text style={styles.heroLabel}>Family Overview</Text>
            <Ionicons
              name="ellipsis-horizontal"
              size={16}
              color="rgba(255,255,255,0.6)"
            />
          </View>
          <View style={styles.heroBalanceRow}>
            <View style={styles.heroBalanceItem}>
              <Text style={styles.heroBalanceValue}>{pendingCount}</Text>
              <Text style={styles.heroBalanceLabel}>Active</Text>
            </View>
            <View style={styles.heroBalanceDivider} />
            <View style={styles.heroBalanceItem}>
              <Text style={styles.heroBalanceValue}>{doneCount}</Text>
              <Text style={styles.heroBalanceLabel}>Done</Text>
            </View>
            <View style={styles.heroBalanceDivider} />
            <View style={styles.heroBalanceItem}>
              <Text style={styles.heroBalanceValue}>
                {approvedMembers.length}
              </Text>
              <Text style={styles.heroBalanceLabel}>Members</Text>
            </View>
          </View>
          <View style={styles.heroFooter}>
            <View style={styles.heroFooterItem}>
              <Ionicons
                name="trending-up-outline"
                size={14}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.heroFooterText}>
                {doneCount > 0
                  ? `${Math.round((doneCount / (pendingCount + doneCount)) * 100)}% complete`
                  : "No tasks yet"}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Quick Actions ─── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTaskForm(true);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionCircle,
                { backgroundColor: Colors.light.primaryLight },
              ]}
            >
              <Ionicons
                name="add-outline"
                size={24}
                color={Colors.light.primary}
              />
            </View>
            <Text style={styles.actionLabel}>Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAnnounceFormKey((k) => k + 1);
              setShowAnnounceForm(true);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionCircle,
                { backgroundColor: Colors.light.warningLight },
              ]}
            >
              <Ionicons
                name="megaphone-outline"
                size={24}
                color={Colors.light.warning}
              />
            </View>
            <Text style={styles.actionLabel}>Announce</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/family-locations");
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionCircle,
                { backgroundColor: Colors.light.successLight },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={24}
                color={Colors.light.success}
              />
            </View>
            <Text style={styles.actionLabel}>Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/family");
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionCircle,
                { backgroundColor: Colors.light.secondaryLight },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={24}
                color={Colors.light.secondary}
              />
            </View>
            <Text style={styles.actionLabel}>Family</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Members ─── */}
        {approvedMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Members</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.memberScroll}
            >
              {approvedMembers.slice(0, 10).map((m: any) => {
                const initial =
                  m.displayName?.charAt(0).toUpperCase() || "?";
                const isAdmin =
                  m.role === "parent" || m.role === "co-parent";
                return (
                  <View key={m.id} style={styles.memberChip}>
                    <View
                      style={[
                        styles.memberChipAvatar,
                        {
                          backgroundColor: isAdmin
                            ? Colors.light.primary
                            : Colors.light.secondary,
                        },
                      ]}
                    >
                      <Text style={styles.memberChipText}>{initial}</Text>
                    </View>
                    <Text style={styles.memberChipName} numberOfLines={1}>
                      {m.displayName}
                    </Text>
                    {isAdmin && (
                      <Ionicons
                        name="shield-checkmark"
                        size={10}
                        color={Colors.light.primary}
                        style={styles.memberChipBadge}
                      />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── Today's Tasks ─── */}
        {todayTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Today&apos;s Tasks</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/tasks")}>
                <Text style={styles.sectionAction}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.txCard}>
              {todayTasks.slice(0, 5).map((t: any, i: number) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => handleTaskToggle(t.id)}
                  activeOpacity={0.7}
                >
                  <TaskItem item={t} />
                  {i < Math.min(todayTasks.length, 5) - 1 && (
                    <View style={styles.txDivider} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── Upcoming ─── */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
                <Text style={styles.sectionAction}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.txCard}>
              {upcomingEvents.map((e: any, i: number) => (
                <View key={e.id}>
                  <EventItem item={e} />
                  {i < upcomingEvents.length - 1 && (
                    <View style={styles.txDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── Announcements ─── */}
        {homeAnnouncements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Announcements</Text>
              <TouchableOpacity onPress={() => router.push("/announcements")}>
                <Text style={styles.sectionAction}>View all</Text>
              </TouchableOpacity>
            </View>
            <AnnouncementCarousel
              announcements={homeAnnouncements}
              currentUserId={user?.id}
              compact
            />
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>

      <TaskFormModal
        visible={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={handleCreateTask}
      />
      <AnnouncementFormModal
        key={announceFormKey}
        visible={showAnnounceForm}
        onClose={() => setShowAnnounceForm(false)}
        onSubmit={handleCreateAnnouncement}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F9FC",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },

  // ─── Top Bar ───
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topGreeting: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  topName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 1,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topFamilyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  topFamilyText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  topNotifBtn: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
  },
  topNotifDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.danger,
    borderWidth: 1.5,
    borderColor: "#F8F9FC",
  },

  // ─── Hero Card ───
  heroCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    padding: 22,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroBalanceItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  heroBalanceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  heroBalanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroBalanceDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  heroFooter: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  heroFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroFooterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },

  // ─── Quick Actions ───
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.text,
  },

  // ─── Section ───
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
  },

  // ─── Members ───
  memberScroll: {
    gap: 12,
    paddingRight: 16,
  },
  memberChip: {
    alignItems: "center",
    gap: 6,
    width: 56,
  },
  memberChipAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  memberChipText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  memberChipName: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
  },
  memberChipBadge: {
    marginTop: -2,
  },

  // ─── Transaction Card ───
  txCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  txBody: {
    flex: 1,
  },
  txName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  txNameDone: {
    textDecorationLine: "line-through",
    color: Colors.light.textTertiary,
  },
  txMeta: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
    fontWeight: "500",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  txDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#F0F0F5",
    marginHorizontal: 16,
  },

  // ─── Event ───
  txDateDay: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.primary,
    lineHeight: 18,
  },
  txDateMon: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.light.primary,
    textTransform: "uppercase",
    marginTop: 1,
  },

  footer: {
    height: 24,
  },
});
