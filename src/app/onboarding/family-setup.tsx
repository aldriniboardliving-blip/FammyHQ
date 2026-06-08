import { useCallback, useMemo } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Colors, BorderRadius } from "@/constants/theme";

const options = [
  {
    id: "create",
    icon: "✨",
    title: "Create New Family",
    description: "Start a new family space and invite members",
    emoji: "👨‍👩‍👧‍👦",
    color: Colors.light.primary,
    bgColor: Colors.light.primaryLight,
    route: "/onboarding/create-family" as const,
  },
  {
    id: "join",
    icon: "🔗",
    title: "Join Existing Family",
    description: "Join using an invitation code or QR code",
    emoji: "🚪",
    color: Colors.light.accent,
    bgColor: Colors.light.accentLight,
    route: "/onboarding/join-family" as const,
  },
];

function OptionCard({ option, index }: { option: typeof options[number]; index: number }) {
  const cardScale = useMemo(() => new Animated.Value(1), []);
  const cardGlow = useMemo(() => new Animated.Value(0), []);

  const handlePressIn = useCallback(() => {
    Animated.spring(cardScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
    Animated.timing(cardGlow, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }, [cardScale, cardGlow]);

  const handlePressOut = useCallback(() => {
    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    Animated.timing(cardGlow, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }, [cardScale, cardGlow]);

  return (
    <AnimatedSection animation="fadeUp" delay={200 + index * 150}>
      <Animated.View style={{ transform: [{ scale: cardScale }] }}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push(option.route)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Animated.View style={[styles.cardGlow, { opacity: cardGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.07] }) }]} />
          <View style={[styles.optionIconContainer, { backgroundColor: option.bgColor }]}>
            <Text style={styles.optionIcon}>{option.icon}</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
          <View style={styles.arrowCircle}>
            <Text style={styles.optionArrow}>→</Text>
          </View>
          <Text style={styles.optionEmoji}>{option.emoji}</Text>
        </TouchableOpacity>
      </Animated.View>
    </AnimatedSection>
  );
}

export default function FamilySetupScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotDone]} />
        <View style={[styles.progressLine, styles.progressLineDone]} />
        <View style={[styles.progressDot, styles.progressDotDone]} />
        <View style={[styles.progressLine, styles.progressLineDone]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
      </View>

      <View style={styles.content}>
        <AnimatedSection animation="fadeUp" delay={50}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏠</Text>
          </View>
          <Text style={styles.stepLabel}>Step 3 of 3</Text>
          <Text style={styles.title}>What would you like to do?</Text>
          <Text style={styles.subtitle}>Set up your family space to get started</Text>
        </AnimatedSection>

        <View style={styles.optionsContainer}>
          {options.map((option, i) => (
            <OptionCard key={option.id} option={option} index={i} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  progressContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20, marginBottom: 16 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.backgroundElement },
  progressDotDone: { backgroundColor: Colors.light.success },
  progressDotActive: { backgroundColor: Colors.light.primary, width: 24, borderRadius: 4 },
  progressLine: { width: 40, height: 2, backgroundColor: Colors.light.backgroundElement, marginHorizontal: 4 },
  progressLineDone: { backgroundColor: Colors.light.success },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.light.primaryLight, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 16 },
  icon: { fontSize: 32 },
  stepLabel: { fontSize: 13, fontWeight: "600", color: Colors.light.primary, textAlign: "center", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.light.text, textAlign: "center" },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, textAlign: "center", marginTop: 6, marginBottom: 40 },
  optionsContainer: { gap: 16 },
  optionCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.backgroundCard, borderRadius: BorderRadius.xl, padding: 20, borderWidth: 1, borderColor: Colors.light.border, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardGlow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.light.primary, borderRadius: BorderRadius.xl },
  optionIconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", marginRight: 16 },
  optionIcon: { fontSize: 28 },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 18, fontWeight: "600", color: Colors.light.text, marginBottom: 4 },
  optionDescription: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.backgroundElement, justifyContent: "center", alignItems: "center", marginLeft: 12 },
  optionArrow: { fontSize: 16, color: Colors.light.textTertiary },
  optionEmoji: { position: "absolute", bottom: -8, right: 12, fontSize: 48, opacity: 0.08 },
});
