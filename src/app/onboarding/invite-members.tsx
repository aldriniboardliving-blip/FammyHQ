import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/stores/familyStore';
import { AnimatedSection } from '@/components/ui/animated-section';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Colors, BorderRadius } from '@/constants/theme';

export default function InviteMembersScreen() {
  const { family } = useFamilyStore();

  if (!family) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AnimatedSection animation="fadeUp" delay={50}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✉️</Text>
          </View>
          <Text style={styles.title}>Invite Family Members</Text>
          <Text style={styles.description}>
            Share the code below to invite members
          </Text>
        </AnimatedSection>

        <AnimatedSection animation="zoom" delay={200}>
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Invite Code</Text>
            <Text style={styles.codeValue}>{family.inviteCode}</Text>
            <TouchableOpacity style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Copy Code</Text>
            </TouchableOpacity>
          </View>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={350}>
          <Text style={styles.shareLabel}>Share via</Text>
          <View style={styles.shareRow}>
            {[{ icon: '💬', label: 'Message' }, { icon: '📧', label: 'Email' }, { icon: '📱', label: 'More' }].map((s, i) => (
              <TouchableOpacity key={i} style={styles.shareBtn}>
                <Text style={styles.shareIcon}>{s.icon}</Text>
                <Text style={styles.shareText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedSection>

        <View style={styles.buttonContainer}>
          <AnimatedButton
            label="Continue"
            variant="primary"
            size="lg"
            onPress={() => router.push('/onboarding/security')}
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
    paddingTop: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 36 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  codeCard: {
    width: '100%',
    backgroundColor: Colors.light.primaryLight,
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.light.primary + '30',
    borderStyle: 'dashed',
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: 8,
    marginBottom: 16,
  },
  copyBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shareLabel: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    marginBottom: 16,
    fontWeight: '500',
  },
  shareRow: {
    flexDirection: 'row',
    gap: 24,
  },
  shareBtn: {
    alignItems: 'center',
    gap: 6,
  },
  shareIcon: { fontSize: 32 },
  shareText: { fontSize: 13, color: Colors.light.textSecondary },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 24,
  },
});
