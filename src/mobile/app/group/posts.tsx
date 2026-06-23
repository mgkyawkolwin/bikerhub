import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { GroupServiceToken } from '@/services/groupService';
import { SocialServiceToken } from '@/services/socialService';
import type { GroupService } from '@/services/groupService';
import type { SocialServiceClient } from '@/services/socialService';
import type Group from '@/models/group';
import type Post from '@/models/post';

export default function GroupPostsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const params = useLocalSearchParams();
  const groupService = useMemo(() => container.resolve<GroupService>(GroupServiceToken), []);
  const socialService = useMemo(() => container.resolve<SocialServiceClient>(SocialServiceToken), []);
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    const response = await groupService.getGroupById(groupId);
    if(!response.ok) {
      setGroup(null);
      return;
    }
    const responseJson = await response.json();
    if (!responseJson.success) {
      setGroup(null);
      return;
    }
    setGroup(responseJson.data ?? null);
  }, [groupId, groupService]);

  const loadPosts = useCallback(async () => {
    if (!groupId) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      const response = await socialService.getPosts(1, 100);
      if (!response.ok) {
        setPosts([]);
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.success) {
        setPosts([]);
        return;
      }
      setPosts(responseJson.data.items.filter((post:any) => post.groupId === groupId));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, socialService]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadGroup(), loadPosts()]);
    setRefreshing(false);
  }, [loadGroup, loadPosts]);

  React.useEffect(() => {
    void loadGroup();
    void loadPosts();
  }, [loadGroup, loadPosts]);

  if (!groupId) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Group</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="group" size={44} color={colors.secondaryText} />
          <Text style={[styles.emptyText, { color: colors.secondaryText, marginTop: 12 }]}>Group not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Group</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id ?? `${item.createdByUserId}-${item.createdAtUTC}`}
        renderItem={({ item }) => (
          <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.postHeader}>
              <Image source={{ uri: item.authorAvatarUrl ?? '' }} style={styles.postAvatar} />
              <View style={styles.postMeta}>
                <Text style={[styles.authorName, { color: colors.text }]}>{item.createdByDisplayName}</Text>
                <View style={styles.metaRow}>
                  <MaterialIcons name="schedule" size={12} color={colors.secondaryText} />
                  <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.createdAtUTC ? new Date(item.createdAtUTC).toLocaleDateString() : 'Today'}</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>
            {item.imageUrls?.length ? (
              <View style={styles.imageGrid}>
                {item.imageUrls.map((uri, idx) => (
                  <Image
                    key={`${item.id}-${idx}`}
                    source={{ uri }}
                    style={[styles.postImage, item.imageUrls && item.imageUrls.length === 1 ? styles.singleImage : styles.multiImage]}
                  />
                ))}
              </View>
            ) : null}
            <View style={styles.postActions}>
              <View style={styles.actionBlock}>
                <MaterialIcons name="favorite-border" size={18} color={colors.secondaryText} />
                <Text style={[styles.actionText, { color: colors.secondaryText }]}>{item.loveCount ?? 0}</Text>
              </View>
              <View style={styles.actionBlock}>
                <MaterialIcons name="comment" size={18} color={colors.secondaryText} />
                <Text style={[styles.actionText, { color: colors.secondaryText }]}>{item.commentCount ?? 0}</Text>
              </View>
              <View style={styles.actionBlock}>
                <MaterialIcons name="share" size={18} color={colors.secondaryText} />
                <Text style={[styles.actionText, { color: colors.secondaryText }]}>{item.shareCount ?? 0}</Text>
              </View>
            </View>
          </View>
        )}
        ListHeaderComponent={
          group ? (
            <>
              <Image source={{ uri: group.coverPhotoUrl ?? '' }} style={styles.coverImage} />
              <View style={[styles.groupHeader, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={styles.groupHeaderRow}>
                  <View style={[styles.groupIcon, { backgroundColor: colors.accent }]}> 
                    <MaterialIcons name={group.icon as any} size={24} color={colors.card} />
                  </View>
                  <View style={styles.groupHeaderInfo}>
                    <Text style={[styles.groupHeaderTitle, { color: colors.text }]}>{group.title}</Text>
                    <View style={styles.groupHeaderMetaRow}>
                      <Text style={[styles.groupMetaText, { color: group.isPrivate ? colors.accent : colors.secondaryText }]}>
                        {group.isPrivate ? 'Private' : 'Public'}
                      </Text>
                      <Text style={[styles.groupMetaText, { color: colors.secondaryText }]}>
                        {group.membersCount ?? 0} members
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
                    <Text style={styles.joinButtonText}>Join</Text>
                  </TouchableOpacity>
                </View>
                {group.description ? (
                  <Text style={[styles.groupDescription, { color: colors.secondaryText }]}>{group.description}</Text>
                ) : null}
                <View style={styles.postsHeader}>
                  <Text style={[styles.postsTitle, { color: colors.text }]}>Group Posts</Text>
                  <Text style={[styles.postsCount, { color: colors.secondaryText }]}>{posts.length}</Text>
                </View>
              </View>
            </>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="post-add" size={48} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.secondaryText, marginTop: 12 }]}>No posts in this group yet.</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 24,
  },
  coverImage: {
    width: '100%',
    height: 180,
  },
  groupHeader: {
    marginHorizontal: 16,
    marginTop: -28,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupHeaderInfo: {
    flex: 1,
  },
  groupHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  groupHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  groupDescription: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
  },
  groupMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 18,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  postsCount: {
    fontSize: 14,
  },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#CCCCCC',
  },
  postMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postImage: {
    borderRadius: 16,
    backgroundColor: '#222222',
  },
  singleImage: {
    width: '100%',
    height: 200,
  },
  multiImage: {
    width: '48%',
    height: 140,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
  },
});
