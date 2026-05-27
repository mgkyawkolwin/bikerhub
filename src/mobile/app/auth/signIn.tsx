import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container, AuthServiceToken } from '@/services';
import type { AuthService } from '@/services';
import { GoogleAuthConfig } from '@/services/googleAuthConfig';
import SnackBar from '@/components/snackbar';

export default function SignInScreen() {
  const router = useRouter();
  const { isDark } = useThemeContext();
  const { t } = useI18n();
  const { setAuthUser } = useAuthContext();
  const authService = useMemo(() => container.resolve<AuthService>(AuthServiceToken), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  WebBrowser.maybeCompleteAuthSession();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GoogleAuthConfig.iosClientId,
    androidClientId: GoogleAuthConfig.androidClientId,
    webClientId: GoogleAuthConfig.webClientId,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      handleGoogleSignIn(response.params.id_token);
    }
  }, [response]);

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
      setAuthUser(user);
      router.replace('/');
    } catch (error) {
      SnackBar.Error((error as Error).message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setLoading(true);
    try {
      const user = await authService.signInWithGoogle(idToken);
      setAuthUser(user);
      router.replace('/');
    } catch (error) {
      SnackBar.Error((error as Error).message || 'Unable to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <ThemedText style={[styles.title, { color: colors.primary }]}>Sign In</ThemedText>
      </View>
      <TouchableOpacity
        style={[styles.googleButton, { backgroundColor: '#4285F4' }]}
        onPress={() => promptAsync()}
        disabled={!request || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
        )}
      </TouchableOpacity>
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
  googleButton: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
