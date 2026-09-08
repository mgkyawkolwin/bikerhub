import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import SnackBar from '@/components/snackbar';
import * as SecureStore from 'expo-secure-store';
import { container, UserServiceToken } from '@/services';
import type { UserService } from '@/services';
// import { useAuthContext } from '@/hooks/use-auth-context';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeContext();
  const userService = useMemo(() => container.resolve<UserService>(UserServiceToken), []);
  // const { setAuthUser } = useAuthContext();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await userService.getProfile();
      if (!resp.ok) {
        return;
      }

      const json = await resp.json().catch(() => null);
      const success = json?.success ?? json?.Success ?? true;
      const data = json?.data ?? json?.Data ?? json;

      if (data) {
        setDisplayName(data.displayName ?? data.DisplayName ?? '');
        setEmail(data.email ?? data.Email ?? '');
        setPhone(data.phone ?? data.Phone ?? '');
      }
    } catch (e) {
      console.warn('Failed to load profile', e);
    } finally {
      setLoading(false);
    }
  }, [userService]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!displayName.trim() || !email.trim()) {
      SnackBar.Error('Please fill required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await userService.updateProfile(displayName.trim(), email.trim(), phone.trim());
      const json = await response.json().catch(() => null);
      const success = json?.success ?? json?.Success;
      const data = json?.data ?? json?.Data;
      if (response.ok && success) {
        // Update local auth user by reading stored value and merging server response
        const storedJson = await SecureStore.getItemAsync('auth_user');
        const stored = storedJson ? JSON.parse(storedJson) : {};
        const updated = {
          ...(stored ?? {}),
          displayName: data?.displayName ?? data?.DisplayName ?? displayName.trim(),
          email: data?.email ?? data?.Email ?? email.trim(),
          phone: data?.phone ?? data?.Phone ?? phone.trim(),
        };
        // setAuthUser(updated as any);
        SnackBar.Success('Profile updated.');
        router.back();
      } else {
        SnackBar.Error(json?.message ?? json?.Message ?? 'Unable to update profile.');
      }
    } catch (err) {
      console.error(err);
      SnackBar.Error('Unable to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}> 
        <Text style={[styles.label, { color: colors.secondaryText }]}>Display name</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Display name" placeholderTextColor={colors.secondaryText} />

        <Text style={[styles.label, { color: colors.secondaryText }]}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Email" placeholderTextColor={colors.secondaryText} keyboardType="email-address" autoCapitalize="none" />

        <Text style={[styles.label, { color: colors.secondaryText }]}>Phone</Text>
        <TextInput value={phone} onChangeText={setPhone} style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Phone" placeholderTextColor={colors.secondaryText} keyboardType="phone-pad" />

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.cancel, { borderColor: colors.border }]} onPress={() => router.back()} disabled={loading}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.save, { backgroundColor: colors.accent }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { fontSize: 15, paddingVertical: 10, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancel: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '700' },
  save: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
