import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const router = useRouter();
  const { getAuthUser, setAuthUser } = useAuthContext();
  const authUser = getAuthUser();

  const handleSignOut = () => {
    setAuthUser(null);
    router.replace('/auth/signIn');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
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
            <Text style={[styles.navLabel, { color: colors.text }]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/editprofile')}
          >
            <MaterialIcons name="edit" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Edit Personal Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/changepassword')}
          >
            <MaterialIcons name="lock" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Change Password</Text>
          </TouchableOpacity>
          
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/social/garage', params: { userId: authUser?.id ?? '' } })}
          >
            <MaterialIcons name="garage" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>My Garage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/marketplace', params: { userId: authUser?.id ?? '' } })}
          >
            <MaterialIcons name="storefront" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>My Listing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/ride/list', params: { userId: authUser?.id ?? '' } })}
          >
            <MaterialIcons name="pedal-bike" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>My Rides</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/plan/list', params: { userId: authUser?.id ?? '' } })}
          >
            <MaterialIcons name="event" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>My Plans</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => router.push('/blog/list')}
          >
            <MaterialIcons name="newspaper" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Blogs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/plan/list')}
          >
            <MaterialIcons name="event" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/marketplace')}
          >
            <MaterialIcons name="storefront" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Marketplace</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/challenge/list')}
          >
            <MaterialIcons name="flag" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Challenge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/directory/directory')}
          >
            <MaterialIcons name="business" size={22} color={colors.accent} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Directory</Text>
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
