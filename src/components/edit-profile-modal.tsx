import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";

interface Props {
  visible: boolean;
  initialName: string;
  initialPhotoUri?: string;
  onClose: () => void;
  onSave: (name: string, photoUri?: string) => Promise<void>;
}

export default function EditProfileModal({ visible, initialName, initialPhotoUri, onClose, onSave }: Props) {
  const [name, setName] = useState(initialName);
  const [photoUri, setPhotoUri] = useState<string | undefined>(initialPhotoUri);
  const [saving, setSaving] = useState(false);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const removePhoto = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhotoUri(undefined);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onSave(trimmed, photoUri);
    setSaving(false);
    onClose();
  }, [name, photoUri, onSave, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Edit Profile</Text>

          {/* Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={pickImage} style={styles.photoWrap}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>{initialName.charAt(0).toUpperCase() || "?"}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraBadgeIcon}>📷</Text>
              </View>
            </TouchableOpacity>
            {photoUri ? (
              <TouchableOpacity onPress={removePhoto} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Remove Photo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={pickImage} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name */}
          <Text style={styles.label}>Display Name</Text>
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
  title: { fontSize: 20, fontWeight: "700", color: Colors.light.text, marginBottom: 24 },
  photoSection: { alignItems: "center", marginBottom: 24 },
  photoWrap: { position: "relative" },
  photo: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.light.backgroundElement },
  photoPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.light.primary, justifyContent: "center", alignItems: "center" },
  photoPlaceholderText: { fontSize: 32, fontWeight: "700", color: "#fff" },
  cameraBadge: { position: "absolute", bottom: 0, right: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.primary, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  cameraBadgeIcon: { fontSize: 14 },
  removeBtn: { marginTop: 8 },
  removeBtnText: { fontSize: 13, color: Colors.light.primary, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", color: Colors.light.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5, alignSelf: "flex-start" },
  input: { width: "100%", backgroundColor: Colors.light.backgroundElement, borderRadius: BorderRadius.md, padding: 14, fontSize: 16, color: Colors.light.text, borderWidth: 1, borderColor: Colors.light.border, marginBottom: 24, textAlign: "center" },
  actions: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: { flex: 1, backgroundColor: Colors.light.backgroundElement, paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: Colors.light.textTertiary },
  saveBtn: { flex: 1, backgroundColor: Colors.light.primary, paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: "center" },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
