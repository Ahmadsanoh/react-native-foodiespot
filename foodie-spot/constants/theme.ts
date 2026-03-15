import { Platform } from 'react-native';

const tintColorLight = '#FF6B35';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const palette = {
  primary: '#FF6B35',
  primaryLight: '#FFF4EF',
  secondary: '#8B5CF6',
  accent: '#FFC107',
  error: '#F44336',
  success: '#4CAF50',
};

export const lightColors = {
  background: '#ffffff',
  card: '#ffffff',
  cardAlt: '#f9f9f9',
  border: '#f0f0f0',
  text: '#111111',
  textSecondary: '#666666',
  textTertiary: '#999999',
  input: '#f5f5f5',
  header: palette.primary,
};

export const darkColors = {
  background: '#111827',
  card: '#1F2937',
  cardAlt: '#1A2332',
  border: '#374151',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  input: '#374151',
  header: '#1F2937',
};

export type AppColors = typeof lightColors;

export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,
};

export const radii = {
  button: 12,
  card: 16,
  chip: 20,
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});