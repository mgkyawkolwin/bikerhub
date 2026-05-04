import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import { useAuthContext } from '@/hooks/use-auth-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const router = useRouter();
  const { getAuthUser, setAuthUser } = useAuthContext();
  const authUser = getAuthUser();

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#F7F7F7',
      card: isDark ? '#121212' : '#FFFFFF',
      border: isDark ? '#232323' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const handleSignOut = async () => {
    await SecureStore.deleteItemAsync('auth_user');
    setAuthUser(null);
    router.replace('/auth/signIn');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Profile</ThemedText>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton} activeOpacity={0.8}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.profileTop}>
            <Image
              source={{ uri: authUser?.profilePictureUrl ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80' }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <ThemedText style={[styles.name, { color: colors.primary }]}>{authUser?.name ?? 'MM Biker'}</ThemedText>
              <ThemedText style={[styles.email, { color: colors.secondary }]}>{authUser?.email ?? 'user@example.com'}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>About</ThemedText>
            <ThemedText style={[styles.sectionText, { color: colors.secondary }]}>This is your profile page. Manage your information and account settings here.</ThemedText>
          </View>

          <View style={styles.sectionRow}>
            <View style={[styles.sectionCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <ThemedText style={[styles.sectionValue, { color: colors.primary }]}>12</ThemedText>
              <ThemedText style={[styles.sectionLabel, { color: colors.secondary }]}>Posts</ThemedText>
            </View>
            <View style={[styles.sectionCard, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <ThemedText style={[styles.sectionValue, { color: colors.primary }]}>34</ThemedText>
              <ThemedText style={[styles.sectionLabel, { color: colors.secondary }]}>Replies</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  signOutButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#D32F2F' },
  signOutText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  content: { paddingHorizontal: 16, gap: 16, paddingTop: 16 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 78, height: 78, borderRadius: 999, backgroundColor: '#CCCCCC' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionText: { fontSize: 14, lineHeight: 20 },
  sectionRow: { flexDirection: 'row', gap: 12 },
  sectionCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionValue: { fontSize: 20, fontWeight: '700' },
  sectionLabel: { fontSize: 12, marginTop: 4 },
});
