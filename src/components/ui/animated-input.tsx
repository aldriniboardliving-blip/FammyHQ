import { useMemo } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface AnimatedInputProps extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

export function AnimatedInput({
  label,
  icon,
  error,
  hint,
  containerStyle,
  style,
  ...props
}: AnimatedInputProps) {
  const focusAnim = useMemo(() => new Animated.Value(0), []);
  const borderColor = useMemo(
    () =>
      focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.light.border, Colors.light.primary],
      }),
    [focusAnim]
  );

  const handleFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputContainer, { borderColor }, error && styles.inputError]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.light.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  label: { fontSize: 14, fontWeight: '500', color: Colors.light.textSecondary, marginBottom: Spacing.sm, marginLeft: 2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.backgroundCard, borderWidth: 1.5, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, height: 52 },
  inputError: { borderColor: Colors.light.danger },
  icon: { fontSize: 18, marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 16, color: Colors.light.text, height: '100%' },
  error: { fontSize: 12, color: Colors.light.danger, marginTop: 4, marginLeft: 2 },
  hint: { fontSize: 12, color: Colors.light.textTertiary, marginTop: 4, marginLeft: 2 },
});
