import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeContextProvider, useThemeContext } from '@/hooks/use-theme-context';
import { I18nProvider } from '@/i18n';
import '@/services/diContainer';
import SnackBar from '@/components/snackbar';

function InnerLayout() {
  const { colorScheme, isDark } = useThemeContext();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SnackBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeContextProvider>
      <I18nProvider>
        <InnerLayout />
      </I18nProvider>
    </ThemeContextProvider>
  );
}
