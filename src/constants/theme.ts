import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A2E',
    textSecondary: '#467896',
    textTertiary: '#82bebe',
    background: '#F7FAFC',
    backgroundCard: '#FFFFFF',
    backgroundElement: '#EFF7F5',
    backgroundSelected: '#D9EDEA',
    border: '#C8DED9',
    borderLight: '#E4F1EE',
    primary: '#1E506E',
    primaryLight: '#E5F0F5',
    primaryDark: '#163D54',
    secondary: '#82C8BE',
    secondaryLight: '#F0F9F7',
    accent: '#FAC85A',
    accentLight: '#FEF8E8',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    gradientStart: '#1E506E',
    gradientEnd: '#82C8BE',
    glassBg: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    shadow: 'rgba(30, 80, 110, 0.12)',
    overlay: 'rgba(30, 80, 110, 0.4)',
  },
  dark: {
    text: '#E2E8F0',
    textSecondary: '#82C8BE',
    textTertiary: '#64748B',
    background: '#0F1A24',
    backgroundCard: '#162B38',
    backgroundElement: '#1A3040',
    backgroundSelected: '#1E506E',
    border: '#28506E',
    borderLight: '#1E3A50',
    primary: '#82C8BE',
    primaryLight: '#1A3A42',
    primaryDark: '#1E506E',
    secondary: '#FAC85A',
    secondaryLight: '#2A2410',
    accent: '#FAC85A',
    accentLight: '#2A2410',
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    danger: '#F87171',
    dangerLight: '#7F1D1D',
    gradientStart: '#0F1A24',
    gradientEnd: '#1E506E',
    glassBg: 'rgba(22, 43, 56, 0.7)',
    glassBorder: 'rgba(130, 200, 190, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const Typography = {
  h1: { fontSize: 36, fontWeight: '700', lineHeight: 44 },
  h2: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h3: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  small: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  smallBold: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
