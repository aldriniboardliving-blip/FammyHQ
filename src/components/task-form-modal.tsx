import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";
import { useFamilyStore } from "@/stores/familyStore";
import type { Task } from "@/stores/taskStore";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  editTask?: Task | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: string;
  reward: string;
  visibility: string;
}

const PRIORITIES = ["low", "normal", "high", "urgent"];
const VISIBILITY_OPTS = [
  { value: "all", label: "Everyone", icon: "people-outline" as const },
  { value: "personal", label: "Only Me", icon: "lock-closed-outline" as const },
];
const PRIORITY_COLORS: Record<string, string> = {
  low: Colors.light.success,
  normal: Colors.light.primary,
  high: Colors.light.warning,
  urgent: Colors.light.danger,
};

function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function TaskFormModal({ visible, onClose, onSubmit, editTask }: Props) {
  const { members } = useFamilyStore();
  const approvedMembers = members.filter((m) => m.status === "approved");

  const [title, setTitle] = useState(editTask?.title ?? "");
  const [description, setDescription] = useState(editTask?.description ?? "");
  const [assignedTo, setAssignedTo] = useState(editTask?.assignedTo ?? "");
  const [dueDate, setDueDate] = useState(editTask?.dueDate ?? "");
  const [priority, setPriority] = useState(editTask?.priority ?? "normal");
  const [reward, setReward] = useState(editTask?.reward ?? "");
  const [visibility, setVisibility] = useState(editTask?.visibility ?? "all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateValue = useMemo(() => (dueDate ? new Date(dueDate) : new Date()), [dueDate]);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDueDate(selectedDate.toISOString());
    }
  }, [setShowDatePicker, setDueDate]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Task title is required");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!dueDate) {
      setError("Due date is required");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError("");
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        dueDate,
        priority,
        reward: reward.trim(),
        visibility,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch {
      setError("Failed to save task");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editTask ? "Edit Task" : "New Task"}</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.light.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Title */}
          <Text style={styles.label}>
            Title <Text style={{ color: Colors.light.danger }}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            placeholderTextColor={Colors.light.textTertiary}
            autoFocus={!editTask}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details..."
            placeholderTextColor={Colors.light.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Assignee */}
          <Text style={styles.label}>Assign to</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assigneeRow}>
            <TouchableOpacity
              style={[styles.assigneeChip, !assignedTo && styles.assigneeChipActive]}
              onPress={() => setAssignedTo("")}
            >
              <Ionicons name="person-outline" size={16} color={!assignedTo ? "#fff" : Colors.light.textTertiary} />
              <Text style={[styles.assigneeChipText, !assignedTo && styles.assigneeChipTextActive]}>Unassigned</Text>
            </TouchableOpacity>
            {approvedMembers.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.assigneeChip, assignedTo === m.userId && styles.assigneeChipActive]}
                onPress={() => setAssignedTo(m.userId)}
              >
                <Text style={[styles.assigneeChipText, assignedTo === m.userId && styles.assigneeChipTextActive]}>
                  {m.displayName || "Member"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Due Date */}
          <Text style={styles.label}>
            Due date <Text style={{ color: Colors.light.danger }}>*</Text>
          </Text>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={dueDate ? Colors.light.primary : Colors.light.textTertiary} />
            <Text style={[styles.datePickerText, !dueDate && { color: Colors.light.textTertiary }]}>
              {dueDate ? formatDisplayDate(dueDate) : "Select a date"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.light.textTertiary} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Priority */}
          <Text style={styles.label}>Priority</Text>
          <View style={styles.optionRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.prioChip, priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.prioChipText, priority === p && { color: "#fff" }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Visibility */}
          <Text style={styles.label}>Visible to</Text>
          <View style={styles.optionRow}>
            {VISIBILITY_OPTS.map((v) => (
              <TouchableOpacity
                key={v.value}
                style={[styles.visCard, visibility === v.value && styles.visCardActive]}
                onPress={() => setVisibility(v.value)}
              >
                <Ionicons
                  name={v.icon}
                  size={20}
                  color={visibility === v.value ? Colors.light.primary : Colors.light.textTertiary}
                />
                <Text style={[styles.visLabel, visibility === v.value && styles.visLabelActive]}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reward */}
          <Text style={styles.label}>Reward (optional)</Text>
          <TextInput
            style={styles.input}
            value={reward}
            onChangeText={setReward}
            placeholder="e.g. Ice cream treat"
            placeholderTextColor={Colors.light.textTertiary}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Ionicons
              name={editTask ? "pencil" : "add"}
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.submitBtnText}>
              {submitting ? "Saving..." : editTask ? "Update Task" : "Create Task"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.light.text },
  headerBtn: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
  form: { flex: 1 },
  formContent: { padding: 20, paddingBottom: 40 },
  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.dangerLight, borderRadius: BorderRadius.md, padding: 12, marginBottom: 16, gap: 8 },
  errorText: { fontSize: 13, fontWeight: "600", color: Colors.light.danger, flex: 1 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.light.text, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#fff", borderRadius: BorderRadius.md, padding: 14, fontSize: 15, color: Colors.light.text, borderWidth: 1, borderColor: Colors.light.border },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  assigneeRow: { flexDirection: "row" },
  assigneeChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: Colors.light.border, gap: 6 },
  assigneeChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  assigneeChipText: { fontSize: 13, fontWeight: "600", color: Colors.light.textSecondary },
  assigneeChipTextActive: { color: "#fff" },
  datePickerBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: BorderRadius.md, padding: 14, borderWidth: 1, borderColor: Colors.light.border, gap: 10 },
  datePickerText: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.light.text },
  optionRow: { flexDirection: "row", gap: 8 },
  prioChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: Colors.light.border },
  prioChipText: { fontSize: 13, fontWeight: "600", color: Colors.light.textSecondary },
  visCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: BorderRadius.md, padding: 14, borderWidth: 1, borderColor: Colors.light.border },
  visCardActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primaryLight },
  visLabel: { fontSize: 14, fontWeight: "600", color: Colors.light.textSecondary },
  visLabelActive: { color: Colors.light.primary },
  footer: { padding: 20, paddingBottom: 36, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border },
  submitBtn: { backgroundColor: Colors.light.primary, borderRadius: BorderRadius.md, padding: 16, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
