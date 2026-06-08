import type { TaskFormData } from "@/components/task-form-modal";
import TaskFormModal from "@/components/task-form-modal";
import FilterSelect from "@/components/filter-select";
import type { SelectOption } from "@/components/filter-select";
import { BorderRadius, Colors } from "@/constants/theme";
import { useFamilyStore } from "@/stores/familyStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUserStore } from "@/stores/userStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type StatusFilter = "all" | "pending" | "ongoing" | "completed";
type TimeFilter = "all" | "today" | "week" | "month";

function getPriorityColor(p: string): string {
  const map: Record<string, string> = {
    low: Colors.light.success,
    normal: Colors.light.primary,
    high: Colors.light.warning,
    urgent: Colors.light.danger,
  };
  return map[p] || map.normal;
}

function getStatusIcon(status: string): keyof typeof Ionicons.glyphMap {
  if (status === "completed") return "checkmark-circle";
  if (status === "ongoing") return "time-outline";
  return "ellipse-outline";
}

function getStatusColor(status: string): string {
  if (status === "completed") return Colors.light.success;
  if (status === "ongoing") return Colors.light.warning;
  return Colors.light.textTertiary;
}



function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getWeekRange(now: Date): { start: Date; end: Date } {
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function matchesTimeFilter(
  dueDate: string | null,
  filter: TimeFilter,
): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  const now = new Date();
  switch (filter) {
    case "today":
      return isSameDay(d, now);
    case "week": {
      const { start, end } = getWeekRange(now);
      return d >= start && d <= end;
    }
    case "month":
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    default:
      return true;
  }
}

export default function TasksScreen() {
  const { family } = useFamilyStore();
  const {
    tasks,
    loadTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  } = useTaskStore();
  const { user } = useUserStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (family?.id) loadTasks(family.id);
  }, [family?.id, loadTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (family?.id) await loadTasks(family.id);
    setRefreshing(false);
  }, [family, loadTasks]);

  const isVisible = useCallback(
    (t: any) =>
      t.visibility === "all" ||
      t.createdBy === user?.id ||
      t.assignedTo === user?.id,
    [user],
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (!isVisible(t)) return false;
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (!matchesTimeFilter(t.dueDate, timeFilter)) return false;
        return true;
      }),
    [tasks, statusFilter, timeFilter, isVisible],
  );

  const visTasks = useMemo(() => tasks.filter(isVisible), [tasks, isVisible]);

  const counts = useMemo(
    () => ({
      all: visTasks.length,
      pending: visTasks.filter((t) => t.status === "pending").length,
      ongoing: visTasks.filter((t) => t.status === "ongoing").length,
      completed: visTasks.filter((t) => t.status === "completed").length,
    }),
    [visTasks],
  );

  const timeCounts = useMemo(
    () => ({
      all: visTasks.length,
      today: visTasks.filter((t) => matchesTimeFilter(t.dueDate, "today"))
        .length,
      week: visTasks.filter((t) => matchesTimeFilter(t.dueDate, "week")).length,
      month: visTasks.filter((t) => matchesTimeFilter(t.dueDate, "month"))
        .length,
    }),
    [visTasks],
  );

  const statusOptions: SelectOption<StatusFilter>[] = useMemo(
    () => [
      { key: "all", label: "All Tasks", icon: "list-outline", count: counts.all, color: Colors.light.primary },
      { key: "pending", label: "Pending", icon: "ellipse-outline", count: counts.pending, color: Colors.light.textTertiary },
      { key: "ongoing", label: "Ongoing", icon: "time-outline", count: counts.ongoing, color: Colors.light.warning },
      { key: "completed", label: "Completed", icon: "checkmark-circle-outline", count: counts.completed, color: Colors.light.success },
    ],
    [counts],
  );

  const timeOptions: SelectOption<TimeFilter>[] = useMemo(
    () => [
      { key: "today", label: "Today", icon: "today-outline", count: timeCounts.today, color: Colors.light.primary },
      { key: "week", label: "This Week", icon: "calendar-outline", count: timeCounts.week, color: Colors.light.secondary },
      { key: "month", label: "This Month", icon: "calendar-number-outline", count: timeCounts.month, color: Colors.light.accent },
    ],
    [timeCounts],
  );

  const handleCreate = async (data: TaskFormData) => {
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
  };

  const handleEdit = async (data: TaskFormData) => {
    if (!editingTask) return;
    await updateTask(editingTask.id, {
      title: data.title,
      description: data.description || null,
      assignedTo: data.assignedTo || null,
      dueDate: data.dueDate || null,
      priority: data.priority,
      reward: data.reward || null,
      visibility: data.visibility,
    });
    setEditingTask(null);
  };

  const canEdit = (task: any) =>
    task.createdBy === user?.id || task.assignedTo === user?.id;
  const canDelete = (task: any) => task.createdBy === user?.id;

  const handleDelete = (taskId: string, taskTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Task", `Delete "${taskTitle}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteTask(taskId);
        },
      },
    ]);
  };

  const cycleStatus = async (task: any) => {
    if (!user?.id || !canEdit(task)) return;
    const statusCycle = ["pending", "ongoing", "completed"];
    const currentIdx = statusCycle.indexOf(task.status);
    if (currentIdx === -1) return;
    const nextIdx = (currentIdx + 1) % statusCycle.length;
    const nextStatus = statusCycle[nextIdx] as
      | "pending"
      | "ongoing"
      | "completed";
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateTaskStatus(task.id, nextStatus, user.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.screen}>
      {/* Filter Row */}
      <View style={styles.filterRow}>
        <View style={styles.filterCol}>
          <FilterSelect
            options={statusOptions}
            selected={statusFilter}
            onSelect={setStatusFilter}
            label="Status"
          />
        </View>
        <View style={styles.filterCol}>
          <FilterSelect
            options={timeOptions}
            selected={timeFilter}
            onSelect={setTimeFilter as (key: string) => void}
            label="When"
          />
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkbox-outline"
              size={48}
              color={Colors.light.textTertiary}
            />
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptyDesc}>
              Tap + to create your first task
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.card,
                task.status === "completed" && styles.cardDone,
              ]}
              activeOpacity={0.95}
              onPress={() => canEdit(task) && cycleStatus(task)}
              onLongPress={() => canEdit(task) && setEditingTask(task)}
              delayLongPress={400}
            >
              <View
                style={[
                  styles.statusBar,
                  { backgroundColor: getStatusColor(task.status) },
                ]}
              />

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <TouchableOpacity
                    style={[
                      styles.statusBtn,
                      { borderColor: getStatusColor(task.status) },
                    ]}
                    onPress={() => canEdit(task) && cycleStatus(task)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={getStatusIcon(task.status)}
                      size={22}
                      color={getStatusColor(task.status)}
                    />
                  </TouchableOpacity>

                  <View style={styles.cardText}>
                    <Text
                      style={[
                        styles.cardTitle,
                        task.status === "completed" && styles.cardTitleDone,
                      ]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>
                    <Text style={styles.statusLabel}>
                      {task.status.charAt(0).toUpperCase() +
                        task.status.slice(1)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: getPriorityColor(task.priority) + "18",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: getPriorityColor(task.priority) },
                      ]}
                    >
                      {task.priority}
                    </Text>
                  </View>
                </View>

                {task.description ? (
                  <Text style={styles.desc} numberOfLines={2}>
                    {task.description}
                  </Text>
                ) : null}

                <View style={styles.metaRow}>
                  {task.assigneeName && (
                    <Text style={styles.metaItem}>
                      <Ionicons
                        name="person-outline"
                        size={12}
                        color={Colors.light.textTertiary}
                      />{" "}
                      {task.assigneeName}
                    </Text>
                  )}
                  {task.dueDate && (
                    <Text style={styles.metaItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={Colors.light.textTertiary}
                      />{" "}
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  )}
                  {task.visibility === "personal" && (
                    <Text
                      style={[styles.metaItem, { color: Colors.light.accent }]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={12}
                        color={Colors.light.accent}
                      />{" "}
                      Personal
                    </Text>
                  )}
                  {task.reward ? (
                    <Text
                      style={[styles.metaItem, { color: Colors.light.warning }]}
                    >
                      <Ionicons
                        name="gift-outline"
                        size={12}
                        color={Colors.light.warning}
                      />{" "}
                      {task.reward}
                    </Text>
                  ) : null}
                </View>

                {canEdit(task) || canDelete(task) ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditingTask(task);
                      }}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={14}
                        color={Colors.light.primary}
                      />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => cycleStatus(task)}
                    >
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={14}
                        color={Colors.light.warning}
                      />
                      <Text
                        style={[
                          styles.actionText,
                          { color: Colors.light.warning },
                        ]}
                      >
                        Next Status
                      </Text>
                    </TouchableOpacity>
                    {canDelete(task) && (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          { backgroundColor: Colors.light.dangerLight },
                        ]}
                        onPress={() => handleDelete(task.id, task.title)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color={Colors.light.danger}
                        />
                        <Text
                          style={[
                            styles.actionText,
                            { color: Colors.light.danger },
                          ]}
                        >
                          Delete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowForm(true);
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <TaskFormModal
        key="create"
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
      {editingTask && (
        <TaskFormModal
          key={editingTask.id}
          visible={true}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEdit}
          editTask={editingTask}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  filterRow: { flexDirection: "row", padding: 12, gap: 10, paddingBottom: 4, zIndex: 100 },
  filterCol: { flex: 1 },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 80 },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.light.text },
  emptyDesc: { fontSize: 14, color: Colors.light.textTertiary },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDone: { opacity: 0.65 },
  statusBar: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    lineHeight: 20,
  },
  cardTitleDone: {
    textDecorationLine: "line-through",
    color: Colors.light.textTertiary,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  metaItem: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.borderLight,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Colors.light.backgroundElement,
  },
  actionText: { fontSize: 12, fontWeight: "600", color: Colors.light.primary },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
