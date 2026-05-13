import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
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
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/social/profile', params: { userId: authUser?.id ?? '' } })}
          >
            <MaterialIcons name="person" size={22} color={colors.accent} />
            <ThemedText style={[styles.navLabel, { color: colors.primary }]}>Profile</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/social/garage', params: { userId: authUser?.id ?? '' } })}
          >
            <MaterialIcons name="garage" size={22} color={colors.accent} />
            <ThemedText style={[styles.navLabel, { color: colors.primary }]}>Garage</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/social/listing', params: { userId: authUser?.id ?? '' } })}
          >
            <MaterialIcons name="storefront" size={22} color={colors.accent} />
            <ThemedText style={[styles.navLabel, { color: colors.primary }]}>My Listing</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => router.push('/route')}
          >
            <MaterialIcons name="pedal-bike" size={22} color={colors.accent} />
            <ThemedText style={[styles.navLabel, { color: colors.primary }]}>Rides</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/route/plans')}
          >
            <MaterialIcons name="event" size={22} color={colors.accent} />
            <ThemedText style={[styles.navLabel, { color: colors.primary }]}>Plans</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => router.push('/group/explore')}
          >
            <MaterialIcons name="settings" size={22} color={colors.accent} />
            <ThemedText style={[styles.navLabel, { color: colors.primary }]}>Manage Groups</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/group/explore?section=myGroups')}
          >
            <MaterialIcons name="groups" size={22} color={colors.accent} />
            <ThemedText style={[styles.navLabel, { color: colors.primary }]}>Followed Groups</ThemedText>
          </TouchableOpacity>
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
  card: { borderRadius: 18, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, overflow: 'hidden' },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 78, height: 78, borderRadius: 999, backgroundColor: '#CCCCCC' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12 },
  navLabel: { fontSize: 16, fontWeight: '600' },
});
