import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFamilyStore } from "@/stores/familyStore";
import { useUserStore } from "@/stores/userStore";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Colors, BorderRadius } from "@/constants/theme";
import { normalizeInviteCode } from "@/lib/utils";

function AnimatedCodeDots({ code, maxLength }: { code: string; maxLength: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: maxLength }).map((_, i) => {
        const filled = i < code.length;
        return (
          <Animated.View key={i} style={[styles.dot, filled && styles.dotFilled]}>
            {filled && <Text style={styles.dotText}>{code[i]}</Text>}
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function JoinFamilyScreen() {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const { joinFamily } = useFamilyStore();
  const { user } = useUserStore();
  const inputRef = useRef<TextInput>(null);
  const qrScale = useMemo(() => new Animated.Value(1), []);
  const shakeAnim = useMemo(() => new Animated.Value(1), []);
  const MAX_LENGTH = 6;

  const handleTextChange = useCallback((text: string) => {
    const normalized = normalizeInviteCode(text);
    setInviteCode(normalized.slice(0, MAX_LENGTH));
    setError("");
  }, []);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1.03, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1.03, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleJoin = useCallback(async () => {
    Keyboard.dismiss();
    if (inviteCode.length !== MAX_LENGTH) {
      setError(`Invite code must be ${MAX_LENGTH} characters`);
      shake();
      return;
    }
    if (!user) { setError("User not found"); return; }
    try {
      await joinFamily(inviteCode, user.id, user.role);
      router.push("/onboarding/join-success");
    } catch (e: any) {
      setError(e.message || "Invalid invite code. Please check and try again.");
    }
  }, [inviteCode, user, joinFamily, shake]);

  const handleQrPress = useCallback(() => {
    router.push("/qr-scan");
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AnimatedSection animation="fadeUp" delay={50}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔗</Text>
          </View>
          <Text style={styles.title}>Join Existing Family</Text>
          <Text style={styles.description}>Enter the invite code shared by your family</Text>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={150}>
          <Animated.View style={{ transform: [{ scale: qrScale }] }}>
            <TouchableOpacity style={styles.scanButton} onPress={handleQrPress} activeOpacity={0.9}>
              <Text style={styles.scanIcon}>📷</Text>
              <View style={styles.scanContent}>
                <Text style={styles.scanTitle}>Scan QR Code</Text>
                <Text style={styles.scanDescription}>Use camera to scan family invitation QR</Text>
              </View>
              <View style={styles.scanArrowCircle}>
                <Text style={styles.scanArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </AnimatedSection>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or enter code manually</Text>
          <View style={styles.dividerLine} />
        </View>

        <AnimatedSection animation="fadeUp" delay={250}>
          <Text style={styles.inputLabel}>Invite Code</Text>
          <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1}>
            <Animated.View style={{ transform: [{ scale: shakeAnim }] }}>
              <View style={[styles.codeBox, error ? styles.codeBoxError : null]}>
                <AnimatedCodeDots code={inviteCode} maxLength={MAX_LENGTH} />
              </View>
            </Animated.View>
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={inviteCode}
            onChangeText={handleTextChange}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={MAX_LENGTH}
            keyboardType="ascii-capable"
          />
          {error ? (
            <>
              <Text style={styles.error}>{error}</Text>
              {error.includes("retried automatically") && (
                <TouchableOpacity style={styles.retryBtn} onPress={handleJoin}>
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.hint}>{MAX_LENGTH - inviteCode.length} characters remaining</Text>
          )}
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={350}>
          <View style={styles.hintCard}>
            <Text style={styles.hintIcon}>💡</Text>
            <Text style={styles.hintText}>Ask your family admin for the {MAX_LENGTH}-character invite code</Text>
          </View>
        </AnimatedSection>
      </View>

      <View style={styles.buttonContainer}>
        <AnimatedButton label="Join Family" variant="primary" size="lg" icon="🚪" onPress={handleJoin} disabled={inviteCode.length !== MAX_LENGTH} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 24 },
  backArrow: { fontSize: 20, color: Colors.light.primary },
  backText: { fontSize: 16, color: Colors.light.primary, fontWeight: "500" },
  iconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.light.accentLight, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 20 },
  icon: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: "700", color: Colors.light.text, textAlign: "center", marginBottom: 8 },
  description: { fontSize: 16, color: Colors.light.textSecondary, textAlign: "center", marginBottom: 24 },
  scanButton: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.backgroundCard, borderRadius: BorderRadius.lg, padding: 16, borderWidth: 1.5, borderColor: Colors.light.border, borderStyle: "dashed" },
  scanIcon: { fontSize: 28, marginRight: 14 },
  scanContent: { flex: 1 },
  scanTitle: { fontSize: 16, fontWeight: "600", color: Colors.light.text, marginBottom: 2 },
  scanDescription: { fontSize: 13, color: Colors.light.textTertiary },
  scanArrowCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.light.backgroundElement, justifyContent: "center", alignItems: "center" },
  scanArrow: { fontSize: 14, color: Colors.light.textTertiary },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.light.border },
  dividerText: { marginHorizontal: 16, fontSize: 13, color: Colors.light.textTertiary, fontWeight: "500" },
  inputLabel: { fontSize: 14, fontWeight: "500", color: Colors.light.textSecondary, marginBottom: 10 },
  codeBox: { backgroundColor: Colors.light.backgroundCard, borderWidth: 1.5, borderColor: Colors.light.border, borderRadius: BorderRadius.md, padding: 20 },
  codeBoxError: { borderColor: Colors.light.danger },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 10 },
  dot: { width: 36, height: 44, borderRadius: 8, backgroundColor: Colors.light.backgroundElement, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: Colors.light.borderLight },
  dotFilled: { backgroundColor: Colors.light.primaryLight, borderColor: Colors.light.primary },
  dotText: { fontSize: 20, fontWeight: "700", color: Colors.light.primary },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  error: { color: Colors.light.danger, fontSize: 13, marginTop: 6, textAlign: "center" },
  hint: { fontSize: 12, color: Colors.light.textTertiary, textAlign: "center", marginTop: 6 },
  hintCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.accentLight, borderRadius: BorderRadius.lg, padding: 14, gap: 10, marginTop: 8 },
  hintIcon: { fontSize: 16 },
  hintText: { fontSize: 13, color: Colors.light.textSecondary, flex: 1, lineHeight: 18 },
  retryBtn: { backgroundColor: Colors.light.primary, paddingVertical: 8, paddingHorizontal: 20, borderRadius: BorderRadius.md, alignSelf: "center", marginTop: 8 },
  retryBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  buttonContainer: { paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 32 },
});
