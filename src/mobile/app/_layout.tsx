import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeContextProvider, useThemeContext } from '@/mobile/hooks/use-theme-context';
import { AuthContextProvider } from '@/mobile/hooks/use-auth-context';
import { I18nProvider } from '@/mobile/i18n';
import '@/services/diContainer';
import SnackBar from '@/mobile/components/snackbar';

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
      <AuthContextProvider>
        <I18nProvider>
          <InnerLayout />
        </I18nProvider>
      </AuthContextProvider>
    </ThemeContextProvider>
  );
}
