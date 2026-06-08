import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { Colors } from '@/constants/theme';

export default function OnboardingRedirect() {
  const { isOnboarded } = useUserStore();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    if (isOnboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding/identity');
    }
  }, [isOnboarded]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
