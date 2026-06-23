import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container } from '@/services';
import { SocialServiceToken, SocialServiceClient } from '@/services/socialService';
import type FriendRequest from '@/models/friendRequest';
import type Follower from '@/models/follower';
import SnackBar from '@/components/snackbar';

export default function FollowersScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const params = useLocalSearchParams();
  const { authUser } = useAuthContext();
  const socialService = useMemo(() => container.resolve<SocialServiceClient>(SocialServiceToken), []);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const routeUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const profileUserId = routeUserId ?? authUser?.id;
  const showPendingRequests = Boolean(profileUserId && authUser?.id === profileUserId);

  const loadFollowers = useCallback(async () => {
    setLoading(true);
    try {
      const friendsResponse = await socialService.getFriends();
      let pendingJson = { success: true, data: [] };

      if (showPendingRequests) {
        const pendingResponse = await socialService.getPendingFriendRequests();
        if (!pendingResponse.ok) {
          SnackBar.Error('Failed to load pending friend requests.');
          return;
        }

        pendingJson = await pendingResponse.json();
        if (!pendingJson.success) {
          SnackBar.Error('Failed to load pending friend requests.');
          return;
        }
      }

      if (!friendsResponse.ok) {
        SnackBar.Error('Failed to load followers.');
        return;
      }

      const friendsJson = await friendsResponse.json();
      if (!friendsJson.success) {
        SnackBar.Error('Failed to load followers.');
        return;
      }

      setPendingRequests(showPendingRequests ? pendingJson.data ?? [] : []);
      setFriends(friendsJson.data ?? []);
    } catch (error) {
      console.error('Failed to load followers:', error);
      SnackBar.Error('Failed to load followers.');
    } finally {
      setLoading(false);
    }
  }, [showPendingRequests, socialService]);

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await socialService.approveFriendRequest(requestId);
      if (!response.ok) {
        SnackBar.Error('Unable to approve friend request.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to approve friend request.');
        return;
      }

      SnackBar.Success('Friend request accepted.');
      void loadFollowers();
    } catch (error) {
      console.error('Failed to approve friend request:', error);
      SnackBar.Error('Unable to approve friend request.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await socialService.rejectFriendRequest(requestId);
      if (!response.ok) {
        SnackBar.Error('Unable to reject friend request.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to reject friend request.');
        return;
      }

      SnackBar.Success('Friend request rejected.');
      void loadFollowers();
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      SnackBar.Error('Unable to reject friend request.');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFollowers();
    setRefreshing(false);
  }, [loadFollowers]);

  useEffect(() => {
    void loadFollowers();
  }, [loadFollowers]);

  const renderFriend = ({ item }: { item: Follower }) => (
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

  const renderPendingRequest = (request: FriendRequest) => (
    <View key={request.id} style={[styles.requestItem, { borderColor: colors.border, backgroundColor: colors.card }]}> 
      <View>
        <Text style={[styles.requestTitle, { color: colors.text }]} numberOfLines={1}> {request.fromDisplayName || request.fromUserName} </Text>
        <Text style={[styles.requestSubtitle, { color: colors.secondaryText }]}>Sent on {new Date(request.createdAtUTC).toLocaleDateString()}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.approveButton, { borderColor: colors.accent, backgroundColor: colors.card }]}
          activeOpacity={0.8}
          onPress={() => void handleApproveRequest(request.id)}
        >
          <Text style={[styles.actionText, { color: colors.accent }]}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.8}
          onPress={() => void handleRejectRequest(request.id)}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const listHeader = () => (
    <View style={styles.headerSection}>
      {showPendingRequests ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Friend Requests</Text>
          {loading ? (
            <Text style={[styles.sectionMessage, { color: colors.secondaryText }]}>Loading...</Text>
          ) : pendingRequests.length === 0 ? (
            <Text style={[styles.sectionMessage, { color: colors.secondaryText }]}>No pending friend requests.</Text>
          ) : (
            pendingRequests.map(renderPendingRequest)
          )}
        </>
      ) : null}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: showPendingRequests ? 24 : 0 }]}>Friends</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Followers</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="people" size={48} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.secondaryText, marginTop: 12 }]}>No friends yet.</Text>
          </View>
        ) : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={styles.listContent}
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
  headerSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  requestItem: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  requestSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  requestActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  approveButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  rejectButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
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
