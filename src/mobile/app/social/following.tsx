import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container } from '@/services';
import { SocialServiceToken, SocialServiceClient } from '@/services/socialService';
import type Following from '@/models/following';
import SnackBar from '@/components/snackbar';

export default function FollowingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const params = useLocalSearchParams();
  const { authUser } = useAuthContext();
  const socialService = useMemo(() => container.resolve<SocialServiceClient>(SocialServiceToken), []);
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const routeUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const profileUserId = routeUserId ?? authUser?.id;

  const loadFollowing = useCallback(async () => {
    if (!profileUserId) {
      return;
    }

    setLoading(true);
    try {
      const response = await socialService.getFollowing(profileUserId);
      if (!response.ok) {
        SnackBar.Error('Failed to load following list.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Failed to load following list.');
        return;
      }

      setFollowing(result.data ?? []);
    } catch (error) {
      console.error('Failed to load following list:', error);
      SnackBar.Error('Failed to load following list.');
    } finally {
      setLoading(false);
    }
  }, [profileUserId, socialService]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFollowing();
    setRefreshing(false);
  }, [loadFollowing]);

  useEffect(() => {
    void loadFollowing();
  }, [loadFollowing]);

  const renderFollowingItem = ({ item }: { item: Following }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/social/profile', params: { userId: item.userId } })}
    >
      <View style={[styles.avatar, { backgroundColor: colors.border }]}> 
        <Text style={[styles.avatarText, { color: colors.text }]}> {item.displayName?.[0] ?? item.userName?.[0] ?? '?'} </Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{item.displayName}</Text>
        <Text style={[styles.itemSubtitle, { color: colors.secondaryText }]} numberOfLines={1}>@{item.userName}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Following</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={following}
        keyExtractor={(item) => item.id}
        renderItem={renderFollowingItem}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="people" size={48} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.secondaryText, marginTop: 12 }]}>No one is followed yet.</Text>
          </View>
        ) : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={[styles.listContent, following.length === 0 ? styles.emptyContent : undefined]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 24,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContent: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 14,
  },
});
