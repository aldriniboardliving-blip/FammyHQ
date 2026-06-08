import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import {
  AnimatedListItem,
  AnimatedSection,
} from "@/components/ui/animated-section";
import { BorderRadius, Colors } from "@/constants/theme";
import { useFamilyStore } from "@/stores/familyStore";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FamilyCreatedScreen() {
  const { family } = useFamilyStore();

  if (!family) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AnimatedSection animation="bounce" delay={100}>
          <View style={styles.checkmarkContainer}>
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={300}>
          <Text style={styles.title}>Family Created!</Text>
          <Text style={styles.subtitle}>
            Your family space is ready. Share the invite code below.
          </Text>
        </AnimatedSection>

        <AnimatedListItem index={0}>
          <AnimatedCard variant="primary">
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Family Name</Text>
              <Text style={styles.cardValue}>{family.name}</Text>
            </View>
          </AnimatedCard>
        </AnimatedListItem>

        <AnimatedListItem index={1}>
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Invite Code</Text>
            <Text style={styles.codeValue}>{family.inviteCode}</Text>
            <View style={styles.codeHint}>
              <Text style={styles.codeHintText}>
                Share this with family members
              </Text>
            </View>
          </View>
        </AnimatedListItem>

        <AnimatedSection animation="fadeUp" delay={600}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/onboarding/qr-code")}
            >
              <Text style={styles.secondaryIcon}>📱</Text>
              <Text style={styles.secondaryText}>Generate QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/onboarding/invite-members")}
            >
              <Text style={styles.secondaryIcon}>✉️</Text>
              <Text style={styles.secondaryText}>Invite Members</Text>
            </TouchableOpacity>
          </View>
        </AnimatedSection>

        <View style={styles.continueContainer}>
          <AnimatedButton
            label="Continue to Security"
            variant="primary"
            size="lg"
            onPress={() => router.push("/onboarding/security")}
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
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  checkmarkContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.success,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  checkmark: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  codeCard: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.primary + "30",
    borderStyle: "dashed",
    marginTop: 20,
  },
  codeLabel: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.light.primary,
    letterSpacing: 6,
  },
  codeHint: {
    marginTop: 10,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  codeHintText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  buttonGroup: {
    gap: 10,
    marginTop: 20,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: BorderRadius.md,
    padding: 16,
    gap: 8,
  },
  secondaryIcon: {
    fontSize: 18,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  continueContainer: {
    marginTop: "auto",
    paddingBottom: 24,
  },
});
