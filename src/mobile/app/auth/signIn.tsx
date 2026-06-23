import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container, AuthServiceToken } from '@/services';
import type { AuthService } from '@/services';
import { GoogleAuthConfig } from '@/services/googleAuthConfig';
import SnackBar from '@/components/snackbar';
import appJson from '../../app.json';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { t } = useI18n();
  const { setAuthUser } = useAuthContext();
  const authService = useMemo(() => container.resolve<AuthService>(AuthServiceToken), []);
  const [username, setUsername] = useState('');
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

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      SnackBar.Error('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.signIn(username.trim(), password.trim());
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
        <Text style={[styles.title, { color: colors.text }]}>Sign In</Text>
      </View>
      <View style={styles.content}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder={t.Text.username ?? 'Username'}
          placeholderTextColor={colors.secondaryText}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder={t.Text.password ?? 'Password'}
          placeholderTextColor={colors.secondaryText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleSignIn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: '#4285F4', visibility: "hidden" }]}
          onPress={() => promptAsync()}
          disabled={!request || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.googleButtonText, {visibility: "hidden"}]}>Continue with Google</Text>
          )}
        </TouchableOpacity> */}
        <TouchableOpacity style={[styles.registerButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/auth/register')} disabled={loading}>
          <Text style={[styles.registerButtonText, { color: colors.text }]}>Register</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.versionContainer}>
        <Text style={[styles.version, { color: colors.secondaryText }]}>Version {appJson.expo.version}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    position: 'relative',
  },
  header: {
    marginTop: 54,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    height: 40,
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
    backgroundColor: '#4285F4',
  },
  registerButton: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'transparent',
  },
  registerButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  versionContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  version: {
    fontSize: 13,
    fontWeight: '500',
  },
});
