import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Colors } from "@/constants/theme";
import { useFamilyStore } from "@/stores/familyStore";

export default function AwaitingApprovalScreen() {
  const { memberStatus, family } = useFamilyStore();
  const [step, setStep] = useState<"waiting" | "setup">("waiting");
  const spinAnim = useMemo(() => new Animated.Value(0), []);
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    if (memberStatus === "approved") {
      router.replace("/(tabs)");
    }
  }, [memberStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = useFamilyStore.getState().memberStatus;
      if (current === "approved") {
        router.replace("/(tabs)");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleContinueSetup = useCallback(() => {
    setStep("setup");
  }, []);

  const handleGoToApp = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  if (step === "setup") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <AnimatedSection animation="fadeUp" delay={50}>
            <View style={styles.iconCircle}>
              <Ionicons name="hourglass-outline" size={36} color={Colors.light.primary} />
            </View>
            <Text style={styles.title}>Set up while you wait</Text>
            <Text style={styles.description}>
              You can configure your profile and permissions now. You&apos;ll get full access once the admin approves your request.
            </Text>
          </AnimatedSection>

          <AnimatedSection animation="fadeUp" delay={200}>
            <AnimatedCard variant="primary" style={styles.card}>
              <View style={styles.cardRow}>
                <Ionicons name="shield-checkmark-outline" size={22} color={Colors.light.primary} />
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>Security Setup</Text>
                  <Text style={styles.cardSub}>Set PIN or biometric lock</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.light.textTertiary} />
              </View>
            </AnimatedCard>
          </AnimatedSection>

          <AnimatedSection animation="fadeUp" delay={300}>
            <AnimatedCard variant="primary" style={styles.card}>
              <View style={styles.cardRow}>
                <Ionicons name="notifications-outline" size={22} color={Colors.light.warning} />
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>Permission Setup</Text>
                  <Text style={styles.cardSub}>Enable notifications & location</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.light.textTertiary} />
              </View>
            </AnimatedCard>
          </AnimatedSection>

          <AnimatedSection animation="fadeUp" delay={400}>
            <AnimatedCard variant="warning" style={styles.card}>
              <View style={styles.cardRow}>
                <Ionicons name="information-circle-outline" size={22} color={Colors.light.warning} />
                <Text style={[styles.cardSub, { flex: 1 }]}>
                  Your access is limited until the admin approves your request.
                </Text>
              </View>
            </AnimatedCard>
          </AnimatedSection>

          <View style={styles.buttonContainer}>
            <AnimatedButton
              label="Set Up Security"
              variant="primary"
              size="lg"
              onPress={() => router.push("/onboarding/security")}
            />
            <AnimatedButton
              label="Back to Waiting"
              variant="secondary"
              size="md"
              onPress={() => setStep("waiting")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AnimatedSection animation="bounce" delay={100}>
          <View style={styles.statusCircle}>
            <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} />
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.innerCircle}>
                <Ionicons name="hourglass-outline" size={40} color={Colors.light.primary} />
              </View>
            </Animated.View>
          </View>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={300}>
          <Text style={styles.title}>Request Sent!</Text>
          <Text style={styles.description}>
            Your request to join{family ? ` ${family.name}` : ""} has been sent to the family administrator.
          </Text>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={450}>
          <AnimatedCard variant="warning">
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={18} color={Colors.light.warning} />
              <Text style={styles.infoText}>
                Please wait for the admin to approve your request. You&apos;ll be notified and redirected automatically.
              </Text>
            </View>
          </AnimatedCard>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={550}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Waiting for approval...</Text>
          </View>
        </AnimatedSection>

        <View style={styles.buttonContainer}>
          <AnimatedButton
            label="Continue Setup"
            variant="primary"
            size="lg"
            onPress={handleContinueSetup}
          />
          <AnimatedButton
            label="Browse App"
            variant="secondary"
            size="md"
            onPress={handleGoToApp}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statusCircle: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    borderTopColor: "transparent",
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.warning,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.warning,
  },
  card: {
    width: "100%",
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardCol: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  cardSub: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 1,
  },
  buttonContainer: {
    width: "100%",
    marginTop: "auto",
    paddingBottom: 32,
    gap: 10,
  },
});
