/**
 * Theme tokens for RideHub.
 *
 * This file defines a complete semantic palette for both light and dark
 * modes, including text, surface, border, feedback, icon, and overlay colors.
 * These values are used by `useThemeColor` and support a full dark mode theme.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0A7EA4';
const tintColorDark = '#FFFFFF';

export const Colors = {
  light: {
    text: '#11181C',
    secondaryText: '#475057',
    mutedText: '#687076',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E5E7EB',
    separator: '#CBD5E1',
    placeholder: '#94A3B8',
    tint: tintColorLight,
    accent: '#ff0055',
    accentMuted: '#dd0033',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#FF0000',
    info: '#3B82F6',
    link: '#0A7EA4',
    overlay: 'rgba(15, 23, 42, 0.12)',
    shadow: 'rgba(15, 23, 42, 0.08)',
    icon: '#475057',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    button: '#333333',
    buttonText: '#FFFFFF',
    inputBackground: '#FFFFFF',
    inputBorder: '#CBD5E1',
    sheetBackground: '#F8FAFC',
    black: '#000000',
    white: '#FFFFFF',
  },
  dark: {
    text: '#ECEDEE',
    secondaryText: '#B0B0B0',
    mutedText: '#8B95A1',
    background: '#0D1114',
    surface: '#151718',
    card: '#222222',
    border: '#666666',
    separator: '#2F353B',
    placeholder: '#6B7280',
    tint: tintColorDark,
    accent: '#ff4400',
    accentMuted: '#dd0033',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#ff0000',
    info: '#58A6FF',
    link: '#58A6FF',
    overlay: 'rgba(0, 0, 0, 0.65)',
    shadow: 'rgba(0, 0, 0, 0.35)',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    button: '#333333',
    buttonText: '#FFFFFF',
    inputBackground: '#121319',
    inputBorder: '#2C3238',
    sheetBackground: '#1C1F23',
    black: '#000000',
    white: '#FFFFFF',
  },
} as const;

export type ThemeColorName = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
