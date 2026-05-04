import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container, AuthServiceToken } from '@/services';
import type { AuthService } from '@/services';
import SnackBar from '@/components/snackbar';

const AUTH_USER_STORAGE_KEY = 'auth_user';

export default function SignInScreen() {
  const router = useRouter();
  const { isDark } = useThemeContext();
  const { t } = useI18n();
  const { setAuthUser } = useAuthContext();
  const authService = useMemo(() => container.resolve<AuthService>(AuthServiceToken), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = {
    background: isDark ? '#000000' : '#F7F7F7',
    card: isDark ? '#181818' : '#FFFFFF',
    border: isDark ? '#2B2B2B' : '#E0E0E0',
    primary: isDark ? '#FFFFFF' : '#000000',
    secondary: isDark ? '#B0B0B0' : '#666666',
    accent: '#E85D04',
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      SnackBar.Error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.signIn(email.trim(), password.trim());
      await SecureStore.setItemAsync(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
      setAuthUser(user);
      router.replace('/');
    } catch (error) {
      SnackBar.Error((error as Error).message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <ThemedText style={[styles.title, { color: colors.primary }]}>Sign In</ThemedText>
      </View>
      <View style={styles.content}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.primary, backgroundColor: colors.card }]}
          placeholder={t.Text.email ?? 'Email'}
          placeholderTextColor={colors.secondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.primary, backgroundColor: colors.card }]}
          placeholder={t.Text.password ?? 'Password'}
          placeholderTextColor={colors.secondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleSignIn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.buttonText}>Sign In</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  header: {
    marginTop: 54,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  content: {
    marginTop: 32,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
