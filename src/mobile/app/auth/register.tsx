import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { container, AuthServiceToken } from '@/services';
import type { AuthService } from '@/services';
import SnackBar from '@/components/snackbar';
import LoadingOverlay from '@/components/loadingOverlay';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { t } = useI18n();
  const authService = useMemo(() => container.resolve<AuthService>(AuthServiceToken), []);
  const [userName, setUserName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!userName.trim() || !password.trim()) {
      SnackBar.Error('Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      await authService.register(
        userName.trim(),
        displayName.trim(),
        password.trim(),
        email.trim() || undefined,
        phone.trim() || undefined
      );
      SnackBar.Success('Registration successful. Please sign in.');
      router.replace('/auth/signIn');
    } catch (error) {
      SnackBar.Error((error as Error).message || 'Unable to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <LoadingOverlay isLoading={loading} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <Text style={[styles.title, { color: colors.text }]}>Register</Text>
      </View>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContent}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder={t.Text.userName ?? 'User Name'}
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="none"
            value={userName}
            onChangeText={setUserName}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder={t.Text.displayName ?? 'Display Name'}
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="none"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder={t.Text.password ?? 'Password'}
            placeholderTextColor={colors.secondaryText}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder={t.Text.email ?? 'Email (optional)'}
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            placeholder="Phone (optional)"
            placeholderTextColor={colors.secondaryText}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>Register</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  formContent: {
    marginTop: 32,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
