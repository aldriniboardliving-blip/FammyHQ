import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";

interface Props {
  value: string;
  title?: string;
  subtitle?: string;
}

export default function QRDisplay({ value, title, subtitle }: Props) {
  const [showQR, setShowQR] = useState(false);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join my family on FammyHQ! Use invite code: ${value}`,
      });
    } catch {}
  }, [value]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <TouchableOpacity style={styles.toggleBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowQR(!showQR); }}>
          <Ionicons name={showQR ? "qr-code" : "qr-code-outline"} size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {showQR && (
        <View style={styles.qrWrap}>
          <QRCode value={value} size={180} backgroundColor="#fff" color={Colors.light.primary} />
          <Text style={styles.codeText}>{value}</Text>
        </View>
      )}

      <View style={styles.codeRow}>
        <View style={styles.codeDisplay}>
          <Text style={styles.codeLabel}>Invite Code</Text>
          <Text style={styles.codeValue}>{value}</Text>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={styles.copyText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", borderRadius: BorderRadius.xl, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  subtitle: { fontSize: 13, color: Colors.light.textTertiary, marginTop: 2 },
  toggleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.light.primaryLight, justifyContent: "center", alignItems: "center" },
  qrWrap: { alignItems: "center", paddingVertical: 16, gap: 12 },
  codeText: { fontSize: 14, fontWeight: "700", color: Colors.light.primary, letterSpacing: 3 },
  codeRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.backgroundElement, borderRadius: BorderRadius.md, padding: 12, marginTop: 4, gap: 10 },
  codeDisplay: { flex: 1 },
  codeLabel: { fontSize: 11, fontWeight: "600", color: Colors.light.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
  codeValue: { fontSize: 18, fontWeight: "800", color: Colors.light.primary, letterSpacing: 2, marginTop: 2 },
  copyBtn: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, gap: 4 },
  copyText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
