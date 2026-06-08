import { AnimatedButton } from "@/components/ui/animated-button";
import { Colors } from "@/constants/theme";
import { useUserStore } from "@/stores/userStore";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const examples: { name: string; emoji: string }[] = [
  { name: "Mom", emoji: "👩" },
  { name: "Dad", emoji: "👨" },
  { name: "Alyssa", emoji: "👧" },
  { name: "Grandpa", emoji: "👴" },
  { name: "Grandma", emoji: "👵" },
];

const MAX_LENGTH = 20;

function usePulseAnimation() {
  const anim = useMemo(() => new Animated.Value(1), []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

function getAvatarEmoji(name: string): string {
  if (!name.trim()) return "👤";
  const first = name.charCodeAt(0);
  const avatars = ["😊", "🤗", "😄", "🌟", "🎉", "💪", "🦸", "🧙", "🎨", "🚀", "🌈", "🦋", "🍀", "⭐", "🔥"];
  return avatars[first % avatars.length];
}

export default function IdentityScreen() {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const stepAnim = useMemo(() => new Animated.Value(0), []);
  const progressAnim = useMemo(() => new Animated.Value(0), []);
  const inputScale = useMemo(() => new Animated.Value(1), []);
  const chipScales = useMemo(() => examples.map(() => new Animated.Value(1)), []);
  const { createUser } = useUserStore();
  const pulseAnim = usePulseAnimation();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.spring(stepAnim, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 80 }).start();
  }, [stepAnim]);

  const handleChipPress = useCallback((name: string, index: number) => {
    Animated.sequence([
      Animated.spring(chipScales[index], { toValue: 0.92, useNativeDriver: true, speed: 50 }),
      Animated.spring(chipScales[index], { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    setDisplayName(name);
    setError("");
  }, [chipScales]);

  const handleTextChange = useCallback((text: string) => {
    if (text.length <= MAX_LENGTH) {
      setDisplayName(text);
      setError("");
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Please enter your name");
      Animated.sequence([
        Animated.timing(inputScale, { toValue: 1.02, duration: 80, useNativeDriver: true }),
        Animated.timing(inputScale, { toValue: 0.98, duration: 80, useNativeDriver: true }),
        Animated.timing(inputScale, { toValue: 1.02, duration: 80, useNativeDriver: true }),
        Animated.timing(inputScale, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
      return;
    }
    try {
      Animated.timing(progressAnim, { toValue: 0.33, duration: 400, useNativeDriver: false }).start();
      Animated.sequence([
        Animated.timing(stepAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(stepAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      await createUser(trimmed, "");
      router.push("/onboarding/role");
    } catch {
      setError("Failed to create profile. Please try again.");
    }
  }, [displayName, progressAnim, stepAnim, createUser, inputScale]);

  const charsLeft = MAX_LENGTH - displayName.length;
  const showCharWarning = displayName.length > MAX_LENGTH * 0.7;
  const hasValidName = displayName.trim().length > 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
          />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
          <Animated.View style={[styles.content, { opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
            <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: inputScale }] }]}>
                <Text style={styles.avatarEmoji}>{getAvatarEmoji(displayName)}</Text>
              </Animated.View>
            </Animated.View>

            {hasValidName && (
              <Animated.View style={styles.namePreview}>
                <Text style={styles.namePreviewLabel}>You&apos;ll appear as</Text>
                <Text style={styles.namePreviewText}>{displayName.trim()}</Text>
              </Animated.View>
            )}

            <Text style={styles.stepLabel}>Step 1 of 3</Text>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.description}>This name will be visible to your family members.</Text>

            <Animated.View style={{ transform: [{ scale: inputScale }] }}>
              <View style={[styles.inputContainer, isFocused && styles.inputFocused, error ? styles.inputError : null]}>
                <Text style={styles.inputIcon}>📝</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.light.textTertiary}
                  value={displayName}
                  onChangeText={handleTextChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                {displayName.length > 0 && (
                  <TouchableOpacity onPress={() => { setDisplayName(""); setError(""); inputRef.current?.focus(); }} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputFooter}>
                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : showCharWarning ? (
                  <Text style={styles.charCount}>{charsLeft} characters left</Text>
                ) : (
                  <View style={styles.hintRow}>
                    <Text style={styles.hintDot}>💡</Text>
                    <Text style={styles.hintText}>Tap a name below to quick-fill</Text>
                  </View>
                )}
              </View>
            </Animated.View>

            <View style={styles.examples}>
              <Text style={styles.examplesLabel}>Quick select</Text>
              <View style={styles.chipsRow}>
                {examples.map((example, i) => {
                  const isSelected = displayName === example.name;
                  return (
                    <Animated.View key={example.name} style={{ transform: [{ scale: chipScales[i] }] }}>
                      <TouchableOpacity
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => handleChipPress(example.name, i)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.chipEmoji}>{example.emoji}</Text>
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{example.name}</Text>
                        {isSelected && <Text style={styles.chipCheck}>✓</Text>}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <AnimatedButton label={hasValidName ? `Continue as ${displayName.trim()}` : "Continue"} variant="primary" size="lg" onPress={handleSubmit} disabled={!hasValidName} />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  progressContainer: { height: 3, backgroundColor: Colors.light.backgroundElement, marginHorizontal: 24, marginTop: 8, borderRadius: 2, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: Colors.light.primary, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  avatarRing: { alignSelf: "center", width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.light.primaryLight, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  iconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.light.primary, justifyContent: "center", alignItems: "center" },
  avatarEmoji: { fontSize: 34 },
  namePreview: { alignSelf: "center", alignItems: "center", marginBottom: 8 },
  namePreviewLabel: { fontSize: 11, color: Colors.light.textTertiary, fontWeight: "500", textTransform: "uppercase", letterSpacing: 1 },
  namePreviewText: { fontSize: 18, fontWeight: "700", color: Colors.light.primary, marginTop: 2 },
  stepLabel: { fontSize: 13, fontWeight: "600", color: Colors.light.primary, textAlign: "center", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", color: Colors.light.text, textAlign: "center", marginBottom: 12 },
  description: { fontSize: 16, color: Colors.light.textSecondary, textAlign: "center", lineHeight: 24 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.backgroundCard, borderWidth: 1.5, borderColor: Colors.light.border, borderRadius: 16, paddingHorizontal: 16, height: 56, marginTop: 32, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputFocused: { borderColor: Colors.light.primary, shadowOpacity: 0.1, shadowRadius: 12 },
  inputError: { borderColor: Colors.light.danger },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, fontSize: 17, color: Colors.light.text, height: "100%" },
  clearBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.light.backgroundElement, justifyContent: "center", alignItems: "center", marginLeft: 8 },
  clearBtnText: { fontSize: 12, color: Colors.light.textTertiary, fontWeight: "700" },
  inputFooter: { flexDirection: "row", alignItems: "center", marginTop: 6, paddingHorizontal: 4, minHeight: 20 },
  errorText: { fontSize: 13, color: Colors.light.danger, fontWeight: "500", flex: 1 },
  charCount: { fontSize: 12, color: Colors.light.warning, fontWeight: "500", flex: 1 },
  hintRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  hintDot: { fontSize: 12, marginRight: 4 },
  hintText: { fontSize: 12, color: Colors.light.textTertiary },
  examples: { marginTop: 32 },
  examplesLabel: { fontSize: 13, color: Colors.light.textTertiary, marginBottom: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.backgroundElement, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: "transparent", gap: 6 },
  chipActive: { backgroundColor: Colors.light.primaryLight, borderColor: Colors.light.primary },
  chipEmoji: { fontSize: 16 },
  chipText: { fontSize: 14, fontWeight: "600", color: Colors.light.textSecondary },
  chipTextActive: { color: Colors.light.primary },
  chipCheck: { fontSize: 12, color: Colors.light.primary, fontWeight: "700" },
  buttonContainer: { marginTop: "auto", paddingBottom: 24 },
});
