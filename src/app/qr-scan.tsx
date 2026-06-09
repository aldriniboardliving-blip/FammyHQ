import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, BorderRadius } from "@/constants/theme";
import { useFamilyStore } from "@/stores/familyStore";
import { useUserStore } from "@/stores/userStore";

export default function QRScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { joinFamily } = useFamilyStore();
  const { user } = useUserStore();
  const [scanning, setScanning] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const handleScan = useCallback(async (data: string) => {
    if (!scanning || !user?.id) return;
    setScanning(false);
    setIsJoining(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await joinFamily(data.trim(), user.id, user.role || "member");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/onboarding/awaiting-approval");
    } catch (e: any) {
      setIsJoining(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e.message || "Invalid invite code", [
        { text: "Try Again", onPress: () => setScanning(true) },
      ]);
    }
  }, [scanning, user, joinFamily]);

  if (!permission) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permTitle}>Camera Permission Required</Text>
        <Text style={styles.permDesc}>We need camera access to scan QR codes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Ionicons name="camera-outline" size={48} color={Colors.light.textTertiary} />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permDesc}>Allow camera access to scan family invitation QR codes.</Text>
        {permission.canAskAgain ? (
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Access</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.permBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.permBtnText}>Open Settings</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.manualLink} onPress={() => router.back()}>
          <Text style={styles.manualLinkText}>Enter code manually instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanning ? (result) => handleScan(result.data) : undefined}
      />
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan QR Code</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Scan frame */}
        <View style={styles.frameWrap}>
          <View style={styles.frame} />
          <Text style={styles.frameHint}>Align QR code within the frame</Text>
        </View>

        {/* Bottom */}
        <View style={styles.bottomArea}>
          <Text style={styles.orText}>Or enter code manually</Text>
          <View style={styles.manualRow}>
            <TouchableOpacity
              style={styles.manualBtn}
              onPress={() => router.push({ pathname: "/onboarding/join-family", params: { manual: "true" } })}
            >
              <Text style={styles.manualBtnText}>Enter Invite Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isJoining && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Joining family...</Text>
            <Text style={styles.loadingHint}>Decrypting invitation</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  permContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.light.background, padding: 24, gap: 8 },
  permTitle: { fontSize: 18, fontWeight: "700", color: Colors.light.text },
  permDesc: { fontSize: 14, color: Colors.light.textTertiary, textAlign: "center" },
  permBtn: { backgroundColor: Colors.light.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: BorderRadius.md, marginTop: 12 },
  permBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  manualLink: { marginTop: 16 },
  manualLinkText: { fontSize: 14, color: Colors.light.primary, fontWeight: "600" },
  overlay: { flex: 1, justifyContent: "space-between" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  backText: { fontSize: 18, color: "#fff", fontWeight: "700" },
  topTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  frameWrap: { alignItems: "center", gap: 16 },
  frame: { width: 240, height: 240, borderRadius: 20, borderWidth: 3, borderColor: "#fff", opacity: 0.8 },
  frameHint: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  bottomArea: { alignItems: "center", paddingBottom: 48, gap: 12 },
  orText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  manualRow: { flexDirection: "row", gap: 12 },
  manualBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
  manualBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingCard: {
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: BorderRadius.lg,
    padding: 32,
    alignItems: "center",
    gap: 12,
    marginHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  loadingHint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
});
