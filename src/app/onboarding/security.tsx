import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "@/stores/userStore";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Colors, BorderRadius } from "@/constants/theme";

const securityOptions = [
  { id: "pin", label: "4-digit PIN", icon: "🔢", description: "Simple numeric code", detail: "Fast and easy to remember" },
  { id: "fingerprint", label: "Fingerprint", icon: "👆", description: "Use your fingerprint", detail: "Fast biometric unlock" },
  { id: "faceid", label: "Face ID", icon: "😊", description: "Use facial recognition", detail: "Secure face unlock" },
];

const PIN_LENGTH = 4;

function PinDots({ pin }: { pin: string }) {
  return (
    <View style={styles.pinDotsRow}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <Animated.View key={i} style={[styles.pinDot, i < pin.length && styles.pinDotFilled]}>
          {i < pin.length && <View style={styles.pinDotInner} />}
        </Animated.View>
      ))}
    </View>
  );
}

export default function SecurityScreen() {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"method" | "pin" | "confirm">("method");
  const [error, setError] = useState("");
  const { updateUser } = useUserStore();
  const cardScales = useMemo(() => securityOptions.map(() => new Animated.Value(1)), []);
  const shakeAnim = useMemo(() => new Animated.Value(1), []);
  const pinInputRef = useRef<TextInput>(null);

  const handleSelectMethod = useCallback((id: string, index: number) => {
    Animated.sequence([
      Animated.spring(cardScales[index], { toValue: 0.95, useNativeDriver: true, speed: 50 }),
      Animated.spring(cardScales[index], { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    setSelectedMethod(id);
    setError("");
    if (id === "pin") { setStep("pin"); setTimeout(() => pinInputRef.current?.focus(), 300); }
    else { setStep("method"); }
  }, [cardScales]);

  const handlePinChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, PIN_LENGTH);
    if (step === "pin") {
      setPin(cleaned);
      setError("");
      if (cleaned.length === PIN_LENGTH) {
        setTimeout(() => setStep("confirm"), 300);
      }
    } else {
      setConfirmPin(cleaned);
      setError("");
    }
  }, [step]);

  const handleContinue = async () => {
    if (selectedMethod === "pin") {
      if (pin.length !== PIN_LENGTH) { setError(`PIN must be ${PIN_LENGTH} digits`); shake(); return; }
      if (step === "confirm" && pin !== confirmPin) { setError("PINs do not match"); shake(); return; }
      if (step === "confirm") {
        try {
          await updateUser({ pin });
          router.push("/onboarding/permissions");
        } catch { setError("Failed to save PIN"); }
        return;
      }
    } else {
      router.push("/onboarding/permissions");
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1.03, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1.03, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const isBiometric = selectedMethod && selectedMethod !== "pin";
  const currentPin = step === "pin" ? pin : confirmPin;
  const pinLabel = step === "pin" ? `Create your ${PIN_LENGTH}-digit PIN` : "Confirm your PIN";
  const pinSubLabel = step === "pin" ? "Choose a PIN you'll remember" : "Enter the same PIN again";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
        <AnimatedSection animation="fadeUp" delay={50}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔒</Text>
          </View>
          <Text style={styles.title}>Protect your account</Text>
          <Text style={styles.description}>Secure your family&apos;s information</Text>
        </AnimatedSection>

        {step === "method" && (
          <View style={styles.optionsContainer}>
            {securityOptions.map((option, index) => {
              const isSelected = selectedMethod === option.id;
              return (
                <AnimatedSection key={option.id} animation="fadeLeft" delay={100 + index * 80}>
                  <Animated.View style={{ transform: [{ scale: cardScales[index] }] }}>
                    <TouchableOpacity
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => handleSelectMethod(option.id, index)}
                      activeOpacity={0.95}
                    >
                      <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                        <Text style={styles.optionEmoji}>{option.icon}</Text>
                      </View>
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionLabel}>{option.label}</Text>
                        <Text style={styles.optionDescription}>{option.detail}</Text>
                      </View>
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                </AnimatedSection>
              );
            })}
          </View>
        )}

        {(step === "pin" || step === "confirm") && (
          <AnimatedSection animation="fadeUp" delay={100}>
            <Animated.View style={{ transform: [{ scale: shakeAnim }] }}>
              <View style={styles.pinSection}>
                <Text style={styles.pinLabel}>{pinLabel}</Text>
                <Text style={styles.pinSubLabel}>{pinSubLabel}</Text>
                <TouchableOpacity onPress={() => pinInputRef.current?.focus()} activeOpacity={1}>
                  <View style={styles.pinBox}>
                    <PinDots pin={currentPin} />
                  </View>
                </TouchableOpacity>
                <TextInput
                  ref={pinInputRef}
                  style={styles.hiddenInput}
                  value={currentPin}
                  onChangeText={handlePinChange}
                  keyboardType="numeric"
                  maxLength={PIN_LENGTH}
                  secureTextEntry
                  autoFocus
                />
                <TouchableOpacity style={styles.pinBackBtn} onPress={() => { setStep("method"); setPin(""); setConfirmPin(""); }}>
                  <Text style={styles.pinBackText}>← Choose a different method</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </AnimatedSection>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.buttonContainer}>
          {isBiometric && (
            <TouchableOpacity style={styles.skipButton} onPress={() => router.push("/onboarding/permissions")}>
              <Text style={styles.skipText}>I&apos;ll set this up later</Text>
            </TouchableOpacity>
          )}
          {selectedMethod && (
            <AnimatedButton
              label={isBiometric ? `Enable ${securityOptions.find(o => o.id === selectedMethod)?.label}` : step === "confirm" ? "Save PIN" : "Continue"}
              variant="primary"
              size="lg"
              onPress={handleContinue}
              disabled={step === "confirm" && confirmPin.length !== PIN_LENGTH}
            />
          )}
          {!selectedMethod && (
            <TouchableOpacity style={styles.skipButton} onPress={() => router.push("/onboarding/permissions")}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  iconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.light.accentLight, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 16 },
  icon: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.light.text, textAlign: "center", marginBottom: 6 },
  description: { fontSize: 15, color: Colors.light.textSecondary, textAlign: "center", marginBottom: 28 },
  optionsContainer: { gap: 10 },
  optionCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.backgroundCard, borderRadius: BorderRadius.lg, padding: 16, borderWidth: 1.5, borderColor: Colors.light.border },
  optionCardSelected: { backgroundColor: Colors.light.accentLight, borderColor: Colors.light.accent },
  optionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.light.backgroundElement, justifyContent: "center", alignItems: "center", marginRight: 14 },
  optionIconSelected: { backgroundColor: Colors.light.accentLight },
  optionEmoji: { fontSize: 22 },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: "600", color: Colors.light.text },
  optionDescription: { fontSize: 13, color: Colors.light.textTertiary, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.light.border, justifyContent: "center", alignItems: "center", marginLeft: 12 },
  radioSelected: { borderColor: Colors.light.accent },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.light.accent },
  pinSection: { alignItems: "center", marginTop: 16 },
  pinLabel: { fontSize: 18, fontWeight: "600", color: Colors.light.text, textAlign: "center" },
  pinSubLabel: { fontSize: 14, color: Colors.light.textSecondary, textAlign: "center", marginTop: 4, marginBottom: 24 },
  pinBox: { backgroundColor: Colors.light.backgroundCard, borderWidth: 1.5, borderColor: Colors.light.border, borderRadius: BorderRadius.lg, padding: 24, alignSelf: "center" },
  pinDotsRow: { flexDirection: "row", gap: 16 },
  pinDot: { width: 48, height: 56, borderRadius: 12, backgroundColor: Colors.light.backgroundElement, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: Colors.light.borderLight },
  pinDotFilled: { backgroundColor: Colors.light.primaryLight, borderColor: Colors.light.primary },
  pinDotInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.light.primary },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  pinBackBtn: { marginTop: 20 },
  pinBackText: { fontSize: 14, color: Colors.light.primary, fontWeight: "500" },
  error: { color: Colors.light.danger, fontSize: 13, textAlign: "center", marginTop: 12 },
  buttonContainer: { marginTop: "auto", paddingBottom: 24, gap: 12 },
  skipButton: { paddingVertical: 12, alignItems: "center" },
  skipText: { fontSize: 15, color: Colors.light.textTertiary, fontWeight: "500" },
});
