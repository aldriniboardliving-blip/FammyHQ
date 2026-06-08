import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedSection } from '@/components/ui/animated-section';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Colors } from '@/constants/theme';

export default function JoinSuccessScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AnimatedSection animation="bounce" delay={100}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>⏳</Text>
          </View>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={300}>
          <Text style={styles.title}>Request Sent!</Text>
          <Text style={styles.description}>
            Your request to join the family has been sent to the administrator.
          </Text>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={450}>
          <AnimatedCard variant="warning">
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                You&apos;ll be notified once approved. In the meantime, you can explore the app.
              </Text>
            </View>
          </AnimatedCard>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: Colors.light.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 32,
  },
});
