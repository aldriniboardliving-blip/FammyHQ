import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedSection } from "@/components/ui/animated-section";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Colors, BorderRadius } from "@/constants/theme";

type Step = "location" | "notification" | "complete";

const stepConfig: Record<Step, { icon: string; title: string; description: string; features: string[]; bgColor: string; buttonLabel: string }> = {
  location: {
    icon: "📍",
    title: "Location Access",
    description: "Enable for location sharing, check-ins, and geofencing with your family.",
    features: ["Family location sharing", "Check-ins at places", "Geofence alerts"],
    bgColor: Colors.light.primaryLight,
    buttonLabel: "Allow Location",
  },
  notification: {
    icon: "🔔",
    title: "Notifications",
    description: "Get notified about tasks, announcements, and family alerts.",
    features: ["Family alerts & reminders", "Task assignments", "Emergency notifications"],
    bgColor: Colors.light.warningLight,
    buttonLabel: "Allow Notifications",
  },
  complete: {
    icon: "🎉",
    title: "You&apos;re all set!",
    description: "Welcome to Family Command Center. Your family coordination hub is ready.",
    features: [],
    bgColor: Colors.light.successLight,
    buttonLabel: "Start Using FammyHQ",
  },
};

export default function PermissionsScreen() {
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("location");
  const fadeAnim = useMemo(() => new Animated.Value(1), []);
  const slideAnim = useMemo(() => new Animated.Value(0), []);
  const iconPulse = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(iconPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [iconPulse]);

  const transitionToStep = useCallback((step: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(step);
      slideAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const requestLocationPermission = async () => {
    try {
      const Location = await import("expo-location");
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === "granted");
      transitionToStep("notification");
    } catch {
      setLocationPermission(false);
      transitionToStep("notification");
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const Notifications = await import("expo-notifications");
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === "granted");
      transitionToStep("complete");
    } catch {
      setNotificationPermission(false);
      transitionToStep("complete");
    }
  };

  const handleContinue = () => {
    if (currentStep === "location") requestLocationPermission();
    else if (currentStep === "notification") requestNotificationPermission();
    else router.replace("/(tabs)");
  };

  const handleSkip = () => {
    if (currentStep === "location") { setLocationPermission(false); transitionToStep("notification"); }
    else if (currentStep === "notification") { setNotificationPermission(false); transitionToStep("complete"); }
  };

  const config = stepConfig[currentStep];
  const stepNum = { location: 0, notification: 1, complete: 2 }[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          {[0, 1, 2].map((s) => (
            <View key={s} style={[styles.progressDot, s <= stepNum && styles.progressDotDone]} />
          ))}
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <AnimatedSection animation="fadeUp" delay={50} key={currentStep}>
            <Animated.View style={[styles.iconContainer, { backgroundColor: config.bgColor, transform: [{ scale: currentStep === "complete" ? iconPulse : 1 }] }]}>
              <Text style={styles.icon}>{config.icon}</Text>
            </Animated.View>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.description}>{config.description}</Text>

            {config.features.length > 0 && (
              <View style={styles.featureList}>
                {config.features.map((f) => (
                  <View key={f} style={styles.featureItem}>
                    <View style={styles.featureCheck}>
                      <Text style={styles.featureCheckText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}

            {currentStep === "complete" && (
              <AnimatedCard variant="primary" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>📍 Location</Text>
                  <Text style={[styles.summaryValue, { color: locationPermission ? Colors.light.success : Colors.light.danger }]}>
                    {locationPermission ? "Enabled" : "Disabled"}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>🔔 Notifications</Text>
                  <Text style={[styles.summaryValue, { color: notificationPermission ? Colors.light.success : Colors.light.danger }]}>
                    {notificationPermission ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </AnimatedCard>
            )}
          </AnimatedSection>
        </Animated.View>

        <View style={styles.buttonContainer}>
          {currentStep !== "complete" && (
            <TouchableOpacity style={styles.notNowButton} onPress={handleSkip}>
              <Text style={styles.notNowText}>Not Now</Text>
            </TouchableOpacity>
          )}
          <AnimatedButton
            label={currentStep === "complete" ? "Start Using FammyHQ" : "Allow"}
            variant="primary"
            size="lg"
            icon={currentStep === "complete" ? "🚀" : undefined}
            onPress={handleContinue}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  progressContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 32 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.backgroundElement },
  progressDotDone: { backgroundColor: Colors.light.success },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 24 },
  icon: { fontSize: 40 },
  title: { fontSize: 26, fontWeight: "700", color: Colors.light.text, textAlign: "center", marginBottom: 12 },
  description: { fontSize: 16, color: Colors.light.textSecondary, textAlign: "center", lineHeight: 24, marginBottom: 28 },
  featureList: { backgroundColor: Colors.light.backgroundElement, borderRadius: BorderRadius.lg, padding: 16, gap: 12 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.light.primary, justifyContent: "center", alignItems: "center" },
  featureCheckText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  featureText: { fontSize: 15, color: Colors.light.text },
  summaryCard: { marginTop: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  summaryLabel: { fontSize: 15, fontWeight: "500", color: Colors.light.text },
  summaryValue: { fontSize: 15, fontWeight: "600" },
  summaryDivider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 4 },
  buttonContainer: { marginTop: "auto", paddingBottom: 24, gap: 12 },
  notNowButton: { paddingVertical: 12, alignItems: "center" },
  notNowText: { fontSize: 15, color: Colors.light.textTertiary, fontWeight: "500" },
});
