import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; priority: string }) => Promise<void>;
  editData?: { title: string; content: string; priority: string } | null;
}

const PRIORITIES = ["low", "normal", "high", "urgent"];

export default function AnnouncementFormModal({ visible, onClose, onSubmit, editData }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!content.trim()) { setError("Content is required"); return; }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), priority });
      onClose();
    } catch {
      setError("Failed to save announcement");
    }
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editData ? "Edit Announcement" : "New Announcement"}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.light.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Announcement title"
            placeholderTextColor={Colors.light.textTertiary}
          />

          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Write your announcement..."
            placeholderTextColor={Colors.light.textTertiary}
            multiline
            numberOfLines={5}
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.prioRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, priority === p && styles.chipActive]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="megaphone-outline" size={18} color={Colors.light.primary} />
            <Text style={styles.infoText}>
              This announcement will be visible to all family members and a notification will be sent to everyone.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.submitBtnText}>
              {submitting ? "Posting..." : editData ? "Update" : "Post Announcement"}
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
  form: { flex: 1 },
  formContent: { padding: 20, paddingBottom: 40 },
  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.dangerLight, borderRadius: BorderRadius.md, padding: 12, marginBottom: 16, gap: 8 },
  errorText: { fontSize: 13, fontWeight: "600", color: Colors.light.danger, flex: 1 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.light.text, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#fff", borderRadius: BorderRadius.md, padding: 14, fontSize: 15, color: Colors.light.text, borderWidth: 1, borderColor: Colors.light.border },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  prioRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: Colors.light.border },
  chipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.light.textSecondary },
  chipTextActive: { color: "#fff" },
  infoBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.primaryLight, borderRadius: BorderRadius.md, padding: 14, marginTop: 20, gap: 10 },
  infoText: { fontSize: 13, color: Colors.light.primary, fontWeight: "500", flex: 1, lineHeight: 18 },
  footer: { padding: 20, paddingBottom: 36, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border },
  submitBtn: { backgroundColor: Colors.light.primary, borderRadius: BorderRadius.md, padding: 16, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
