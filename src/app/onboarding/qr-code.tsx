import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/stores/familyStore';
import { AnimatedSection } from '@/components/ui/animated-section';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Colors, BorderRadius } from '@/constants/theme';

export default function QRCodeScreen() {
  const { family } = useFamilyStore();

  if (!family) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AnimatedSection animation="fadeUp" delay={50}>
          <View style={styles.iconContainer}>
            <Ionicons name="qr-code-outline" size={32} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>QR Code Invitation</Text>
          <Text style={styles.description}>
            Family members can scan this to join
          </Text>
        </AnimatedSection>

        <AnimatedSection animation="zoom" delay={200}>
          <View style={styles.qrFrame}>
            <QRCode
              value={family.inviteCode}
              size={200}
              backgroundColor={Colors.light.backgroundCard}
              color={Colors.light.text}
            />
          </View>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={350}>
          <AnimatedCard variant="primary">
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Family</Text>
              <Text style={styles.infoValue}>{family.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Code</Text>
              <Text style={styles.infoCode}>{family.inviteCode}</Text>
            </View>
          </AnimatedCard>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={450}>
          <Text style={styles.hint}>
            Share the invite code with family members who can&apos;t scan QR
          </Text>
        </AnimatedSection>
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
    backgroundColor: Colors.light.accentLight,
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
  qrFrame: {
    backgroundColor: Colors.light.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    marginBottom: 32,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 14, color: Colors.light.textSecondary },
  infoValue: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  infoCode: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: 3,
  },
  divider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 4 },
  hint: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
});
