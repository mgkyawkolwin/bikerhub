import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { GroupServiceToken } from '@/services/groupService';
import { SocialPostServiceToken } from '@/services/socialPostService';
import type { GroupService } from '@/services/groupService';
import type { SocialPostService } from '@/services/socialPostService';
import type Group from '@/models/group';
import type SocialPost from '@/models/socialPost';

export default function GroupPostsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const params = useLocalSearchParams();
  const groupService = useMemo(() => container.resolve<GroupService>(GroupServiceToken), []);
  const postService = useMemo(() => container.resolve<SocialPostService>(SocialPostServiceToken), []);
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#FFFFFF',
      card: isDark ? '#121212' : '#F7F7F7',
      border: isDark ? '#232323' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    const groupResult = await groupService.getGroupById(groupId);
    setGroup(groupResult ?? null);
  }, [groupId, groupService]);

  const loadPosts = useCallback(async () => {
    if (!groupId) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      const result = await postService.getPosts(1, 100);
      setPosts(result.items.filter((post) => post.groupId === groupId));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, postService]);

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
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Group</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="group" size={44} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary, marginTop: 12 }]}>Group not found.</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Group</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id ?? `${item.authorId}-${item.createdAt}`}
        renderItem={({ item }) => (
          <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.postHeader}>
              <Image source={{ uri: item.authorAvatarUrl ?? '' }} style={styles.postAvatar} />
              <View style={styles.postMeta}>
                <ThemedText style={[styles.authorName, { color: colors.primary }]}>{item.authorName}</ThemedText>
                <View style={styles.metaRow}>
                  <MaterialIcons name="schedule" size={12} color={colors.secondary} />
                  <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}</ThemedText>
                </View>
              </View>
            </View>
            <ThemedText style={[styles.postContent, { color: colors.primary }]}>{item.content}</ThemedText>
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
                <MaterialIcons name="favorite-border" size={18} color={colors.secondary} />
                <ThemedText style={[styles.actionText, { color: colors.secondary }]}>{item.loveCount ?? 0}</ThemedText>
              </View>
              <View style={styles.actionBlock}>
                <MaterialIcons name="comment" size={18} color={colors.secondary} />
                <ThemedText style={[styles.actionText, { color: colors.secondary }]}>{item.commentCount ?? 0}</ThemedText>
              </View>
              <View style={styles.actionBlock}>
                <MaterialIcons name="share" size={18} color={colors.secondary} />
                <ThemedText style={[styles.actionText, { color: colors.secondary }]}>{item.shareCount ?? 0}</ThemedText>
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
                    <ThemedText style={[styles.groupHeaderTitle, { color: colors.primary }]}>{group.title}</ThemedText>
                    <View style={styles.groupHeaderMetaRow}>
                      <ThemedText style={[styles.groupMetaText, { color: group.isPrivate ? colors.accent : colors.secondary }]}>
                        {group.isPrivate ? 'Private' : 'Public'}
                      </ThemedText>
                      <ThemedText style={[styles.groupMetaText, { color: colors.secondary }]}>
                        {group.membersCount ?? 0} members
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
                    <ThemedText style={styles.joinButtonText}>Join</ThemedText>
                  </TouchableOpacity>
                </View>
                {group.description ? (
                  <ThemedText style={[styles.groupDescription, { color: colors.secondary }]}>{group.description}</ThemedText>
                ) : null}
                <View style={styles.postsHeader}>
                  <ThemedText style={[styles.postsTitle, { color: colors.primary }]}>Group Posts</ThemedText>
                  <ThemedText style={[styles.postsCount, { color: colors.secondary }]}>{posts.length}</ThemedText>
                </View>
              </View>
            </>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="post-add" size={48} color={colors.secondary} />
            <ThemedText style={[styles.emptyText, { color: colors.secondary, marginTop: 12 }]}>No posts in this group yet.</ThemedText>
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
