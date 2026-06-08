import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFamilyStore } from "@/stores/familyStore";
import { useUserStore } from "@/stores/userStore";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Colors, BorderRadius } from "@/constants/theme";

const examples = ["Doe Family", "Smith Family", "Dela Cruz Family"];
const nameEmojis = ["🏡", "🏠", "🌟", "💒", "🌺", "🏰", "🌻", "🎪"];

function getHouseEmoji(name: string): string {
  if (!name.trim()) return "🏡";
  return nameEmojis[name.charCodeAt(0) % nameEmojis.length];
}

export default function CreateFamilyScreen() {
  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { createFamily } = useFamilyStore();
  const { user } = useUserStore();
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useMemo(() => new Animated.Value(1), []);
  const chipScales = useMemo(() => examples.map(() => new Animated.Value(1)), []);
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    if (!familyName.trim()) {
      setError("Please enter your family name");
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1.03, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 1.03, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]).start();
      return;
    }
    if (!user) { setError("User not found"); return; }
    try {
      await createFamily(familyName.trim(), user.id);
      router.push("/onboarding/family-created");
    } catch {
      setError("Failed to create family. Please try again.");
    }
  }, [familyName, user, createFamily, shakeAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AnimatedSection animation="fadeUp" delay={50}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={100}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Animated.View style={{ transform: [{ scale: shakeAnim }] }}>
              <Text style={styles.icon}>{getHouseEmoji(familyName)}</Text>
            </Animated.View>
          </Animated.View>
          <Text style={styles.title}>What is your family name?</Text>
          <Text style={styles.description}>Choose a name your family will recognize</Text>
        </AnimatedSection>

        <Animated.View style={{ transform: [{ scale: shakeAnim }] }}>
          <View style={[styles.inputContainer, isFocused && styles.inputFocused, error ? styles.inputError : null]}>
            <Text style={styles.inputIcon}>🏷️</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="e.g., Smith Family"
              placeholderTextColor={Colors.light.textTertiary}
              value={familyName}
              onChangeText={(text) => { setFamilyName(text); setError(""); }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {familyName.length > 0 && (
              <TouchableOpacity onPress={() => { setFamilyName(""); setError(""); inputRef.current?.focus(); }} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.hintRow}>
              <Text style={styles.hintDot}>💡</Text>
              <Text style={styles.hintText}>Family names help everyone find your space</Text>
            </View>
          )}
        </Animated.View>

        {familyName.trim().length > 0 && (
          <AnimatedSection animation="fadeUp" delay={50}>
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Your family will appear as</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewEmoji}>{getHouseEmoji(familyName)}</Text>
                <Text style={styles.previewText}>{familyName.trim()}</Text>
              </View>
            </View>
          </AnimatedSection>
        )}

        <AnimatedSection animation="fadeUp" delay={200}>
          <View style={styles.examples}>
            <Text style={styles.examplesLabel}>Suggestions</Text>
            <View style={styles.chipsRow}>
              {examples.map((example, i) => {
                const isSelected = familyName === example;
                return (
                  <Animated.View key={example} style={{ transform: [{ scale: chipScales[i] }] }}>
                    <TouchableOpacity
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => {
                        Animated.sequence([
                          Animated.spring(chipScales[i], { toValue: 0.92, useNativeDriver: true, speed: 50 }),
                          Animated.spring(chipScales[i], { toValue: 1, useNativeDriver: true, speed: 20 }),
                        ]).start();
                        setFamilyName(example);
                        setError("");
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{example}</Text>
                      {isSelected && <Text style={styles.chipCheck}>✓</Text>}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </AnimatedSection>

        <View style={styles.buttonContainer}>
          <AnimatedButton
            label={familyName.trim() ? `Create ${familyName.trim()}` : "Create Family"}
            variant="primary"
            size="lg"
            icon="✨"
            onPress={handleSubmit}
            disabled={!familyName.trim()}
          />
        </View>
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
  iconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.light.primaryLight, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 20 },
  icon: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: "700", color: Colors.light.text, textAlign: "center", marginBottom: 8 },
  description: { fontSize: 16, color: Colors.light.textSecondary, textAlign: "center", marginBottom: 32 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.backgroundCard, borderWidth: 1.5, borderColor: Colors.light.border, borderRadius: 16, paddingHorizontal: 16, height: 56, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputFocused: { borderColor: Colors.light.primary, shadowOpacity: 0.1, shadowRadius: 12 },
  inputError: { borderColor: Colors.light.danger },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, fontSize: 17, color: Colors.light.text, height: "100%" },
  clearBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.light.backgroundElement, justifyContent: "center", alignItems: "center", marginLeft: 8 },
  clearBtnText: { fontSize: 12, color: Colors.light.textTertiary, fontWeight: "700" },
  errorText: { fontSize: 13, color: Colors.light.danger, fontWeight: "500", marginTop: 6, paddingHorizontal: 4 },
  hintRow: { flexDirection: "row", alignItems: "center", marginTop: 6, paddingHorizontal: 4 },
  hintDot: { fontSize: 12, marginRight: 4 },
  hintText: { fontSize: 12, color: Colors.light.textTertiary },
  previewCard: { backgroundColor: Colors.light.primaryLight, borderRadius: BorderRadius.lg, padding: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.light.primary + "20" },
  previewLabel: { fontSize: 12, color: Colors.light.primary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  previewEmoji: { fontSize: 28 },
  previewText: { fontSize: 20, fontWeight: "700", color: Colors.light.primary },
  examples: { marginTop: 20 },
  examplesLabel: { fontSize: 13, color: Colors.light.textTertiary, marginBottom: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.backgroundElement, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: "transparent", gap: 6 },
  chipActive: { backgroundColor: Colors.light.primaryLight, borderColor: Colors.light.primary },
  chipText: { fontSize: 12, fontWeight: "500", color: Colors.light.textSecondary },
  chipTextActive: { color: Colors.light.primary, fontWeight: "600" },
  chipCheck: { fontSize: 12, color: Colors.light.primary, fontWeight: "700" },
  buttonContainer: { marginTop: "auto", paddingBottom: 24 },
});
