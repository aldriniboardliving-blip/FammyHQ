import { useMemo } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'accent' | 'warning' | 'success';
  showShadow?: boolean;
}

export function AnimatedCard({
  children,
  style,
  onPress,
  variant = 'default',
  showShadow = true,
}: AnimatedCardProps) {
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const animatedStyle = useMemo(() => ({ transform: [{ scale: scaleAnim }] }), [scaleAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: Colors.light.primaryLight, borderColor: Colors.light.primary + '30' };
      case 'accent':
        return { backgroundColor: Colors.light.accentLight, borderColor: Colors.light.accent + '30' };
      case 'warning':
        return { backgroundColor: Colors.light.warningLight, borderColor: Colors.light.warning + '30' };
      case 'success':
        return { backgroundColor: Colors.light.successLight, borderColor: Colors.light.success + '30' };
      default:
        return { backgroundColor: Colors.light.backgroundCard, borderColor: Colors.light.border };
    }
  };

  const content = (
    <Animated.View
      style={[
        styles.card,
        getVariantStyle(),
        showShadow && styles.shadow,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} activeOpacity={0.95}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
