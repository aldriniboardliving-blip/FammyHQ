import { useCallback, useMemo, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "@/stores/userStore";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Colors, BorderRadius } from "@/constants/theme";

const roles = [
  { id: "parent", label: "Parent", icon: "👨‍👩‍👧", description: "Oversees family management", benefits: ["Assign tasks to members", "Approve new members", "Manage family settings"] },
  { id: "co-parent", label: "Co-Parent", icon: "👨‍👩‍👧‍👦", description: "Shares family responsibilities", benefits: ["Create and manage tasks", "Approve child requests", "Update calendar events"] },
  { id: "child", label: "Child", icon: "👶", description: "Family member with limited controls", benefits: ["View family tasks", "Earn rewards", "Check-in to locations"] },
  { id: "grandparent", label: "Grandparent", icon: "👴", description: "Loving family elder", benefits: ["View family updates", "Receive notifications", "Stay connected"] },
  { id: "guardian", label: "Guardian", icon: "🛡️", description: "Cares for family welfare", benefits: ["Emergency contact access", "Location awareness", "Family alerts"] },
];

export default function RoleScreen() {
  const [selectedRole, setSelectedRole] = useState("");
  const { updateUser } = useUserStore();
  const cardScales = useMemo(() => roles.map(() => new Animated.Value(1)), []);

  const handleSelect = useCallback((id: string, index: number) => {
    Animated.spring(cardScales[index], { toValue: 0.95, useNativeDriver: true, speed: 40 }).start(() => {
      Animated.spring(cardScales[index], { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    });
    setSelectedRole(id);
  }, [cardScales]);

  const handleContinue = async () => {
    if (!selectedRole) return;
    try {
      await updateUser({ role: selectedRole });
      router.push("/onboarding/family-setup");
    } catch {
      // silently fail
    }
  };

  const selected = roles.find(r => r.id === selectedRole);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotDone]} />
        <View style={[styles.progressLine, styles.progressLineDone]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressLine} />
        <View style={styles.progressDot} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedSection animation="fadeUp" delay={50}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🤝</Text>
          </View>
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
          <Text style={styles.title}>Who are you in the family?</Text>
        </AnimatedSection>

        <View style={styles.roleList}>
          {roles.map((role, index) => {
            const isSelected = selectedRole === role.id;
            return (
              <AnimatedSection key={role.id} animation="fadeLeft" delay={150 + index * 80}>
                <Animated.View style={{ transform: [{ scale: cardScales[index] }] }}>
                  <TouchableOpacity
                    style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                    onPress={() => handleSelect(role.id, index)}
                    activeOpacity={0.95}
                  >
                    <View style={[styles.roleIconContainer, isSelected && styles.roleIconContainerSelected]}>
                      <Text style={styles.roleIcon}>{role.icon}</Text>
                    </View>
                    <View style={styles.roleInfo}>
                      <Text style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}>{role.label}</Text>
                      <Text style={styles.roleDescription}>{role.description}</Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && (
                        <Animated.View style={styles.radioInner} />
                      )}
                    </View>
                  </TouchableOpacity>
                  {isSelected && selected && (
                    <Animated.View style={styles.benefitsContainer}>
                      {selected.benefits.map((benefit, i) => (
                        <Animated.View key={i} style={styles.benefitRow}>
                          <Text style={styles.benefitBullet}>✓</Text>
                          <Text style={styles.benefitText}>{benefit}</Text>
                        </Animated.View>
                      ))}
                    </Animated.View>
                  )}
                </Animated.View>
              </AnimatedSection>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <AnimatedButton label="Continue" variant="primary" size="lg" onPress={handleContinue} disabled={!selectedRole} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  progressContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20, marginBottom: 16 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.backgroundElement },
  progressDotDone: { backgroundColor: Colors.light.success },
  progressDotActive: { backgroundColor: Colors.light.primary, width: 24, borderRadius: 4 },
  progressLine: { width: 40, height: 2, backgroundColor: Colors.light.backgroundElement, marginHorizontal: 4 },
  progressLineDone: { backgroundColor: Colors.light.success },
  iconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.light.primaryLight, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 12 },
  icon: { fontSize: 28 },
  stepLabel: { fontSize: 13, fontWeight: "600", color: Colors.light.primary, textAlign: "center", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.light.text, textAlign: "center", marginBottom: 24, paddingHorizontal: 24 },
  roleList: { paddingHorizontal: 24, gap: 10 },
  roleCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.backgroundCard, borderRadius: BorderRadius.lg, padding: 16, borderWidth: 1.5, borderColor: Colors.light.border },
  roleCardSelected: { backgroundColor: Colors.light.primaryLight, borderColor: Colors.light.primary },
  roleIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.light.backgroundElement, justifyContent: "center", alignItems: "center", marginRight: 14 },
  roleIconContainerSelected: { backgroundColor: Colors.light.primaryLight },
  roleIcon: { fontSize: 22 },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 16, fontWeight: "600", color: Colors.light.text, marginBottom: 2 },
  roleLabelSelected: { color: Colors.light.primary },
  roleDescription: { fontSize: 13, color: Colors.light.textTertiary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.light.border, justifyContent: "center", alignItems: "center", marginLeft: 12 },
  radioSelected: { borderColor: Colors.light.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.light.primary },
  benefitsContainer: { marginTop: 6, paddingLeft: 58, gap: 4, paddingBottom: 6 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  benefitBullet: { fontSize: 12, color: Colors.light.success, fontWeight: "700" },
  benefitText: { fontSize: 13, color: Colors.light.textSecondary },
  buttonContainer: { paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 32 },
});
