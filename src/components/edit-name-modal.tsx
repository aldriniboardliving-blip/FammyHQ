import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";

interface Props {
  visible: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export default function EditNameModal({ visible, initialName, onClose, onSave }: Props) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onSave(trimmed);
    setSaving(false);
    onClose();
  }, [name, onSave, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>{initialName.charAt(0).toUpperCase() || "?"}</Text>
          </View>
          <Text style={styles.title}>Edit Display Name</Text>
          <Text style={styles.desc}>Only you can change your name. Other members cannot edit it.</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={Colors.light.textTertiary}
            maxLength={30}
            autoFocus
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!name.trim() || saving) && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={!name.trim() || saving}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: Colors.light.overlay },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, alignItems: "center" },
  handle: { width: 36, height: 4, backgroundColor: Colors.light.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.light.primary, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  iconText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: Colors.light.text, marginBottom: 6 },
  desc: { fontSize: 13, color: Colors.light.textTertiary, textAlign: "center", paddingHorizontal: 20, lineHeight: 18, marginBottom: 24 },
  input: { width: "100%", backgroundColor: Colors.light.backgroundElement, borderRadius: BorderRadius.md, padding: 14, fontSize: 16, color: Colors.light.text, borderWidth: 1, borderColor: Colors.light.border, marginBottom: 24, textAlign: "center" },
  actions: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: { flex: 1, backgroundColor: Colors.light.backgroundElement, paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: Colors.light.textTertiary },
  saveBtn: { flex: 1, backgroundColor: Colors.light.primary, paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: "center" },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
