import { useMemo } from 'react';
import {
  Animated,
  TouchableOpacity,
  type TouchableOpacityProps,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface AnimatedButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string;
  icon?: string;
}

export function AnimatedButton({
  variant = 'primary',
  size = 'md',
  label,
  icon,
  style,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const animatedStyle = useMemo(() => ({ transform: [{ scale: scaleAnim }] }), [scaleAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      ...sizeStyles[size],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
      gap: 8,
    };
    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: Colors.light.primary };
      case 'secondary':
        return { ...base, backgroundColor: Colors.light.secondaryLight };
      case 'outline':
        return { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.light.primary };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'danger':
        return { ...base, backgroundColor: Colors.light.danger };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return Colors.light.secondary;
      case 'outline':
      case 'ghost':
        return Colors.light.primary;
    }
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[getButtonStyle(), disabled && styles.disabled, style as ViewStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={disabled}
        {...props}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.label, { color: getTextColor() }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
};

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  icon: { fontSize: 16 },
  label: { fontSize: 16, fontWeight: '600' },
});
