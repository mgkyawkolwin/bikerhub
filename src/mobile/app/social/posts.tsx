import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { SocialPostServiceToken } from '@/services/socialPostService';
import type { SocialPostService } from '@/services/socialPostService';
import type SocialPost from '@/models/socialPost';

export default function SocialPostsScreen() {
  const ins = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const socialPostService = useMemo(() => container.resolve<SocialPostService>(SocialPostServiceToken), []);

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { colors } = useThemeContext();

  const loadPosts = useCallback(
    async (pageNumber: number, reset = false) => {
      setLoading(true);
      try {
        const result = await socialPostService.getPosts(pageNumber, 4);
        setPosts((prev) => (reset ? result.items : [...prev, ...result.items]));
        setPage(result.page);
        setTotal(result.total);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [socialPostService],
  );

  useFocusEffect(
    useCallback(() => {
      void loadPosts(1, true);
    }, [loadPosts]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadPosts(1, true);
  };

  const handleEndReached = () => {
    if (!loading && posts.length < total) {
      void loadPosts(page + 1);
    }
  };

  const renderPost = ({ item }: { item: SocialPost }) => (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.authorLink}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: '/social/profile', params: { userId: item.authorId ?? '' } })}
        >
          <Image source={{ uri: item.authorAvatarUrl ?? '' }} style={styles.avatar} />
          <View style={styles.postMeta}>
              <ThemedText style={[styles.authorName, { color: colors.text }]}>{item.authorName}</ThemedText>
              <View style={styles.metaRow}>
                <MaterialIcons name="schedule" size={12} color={colors.secondaryText} />
                <ThemedText style={[styles.metaText, { color: colors.secondaryText }]}>{new Date(item.createdAt ?? '').toLocaleDateString()}</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
      </View>

      <ThemedText style={[styles.postContent, { color: colors.text }]}>{item.content}</ThemedText>

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
          <ThemedText style={[styles.actionText, { color: colors.secondaryText }]}>{item.loveCount}</ThemedText>
        </View>
        <View style={styles.actionBlock}>
          <MaterialIcons name="comment" size={18} color={colors.secondaryText} />
          <ThemedText style={[styles.actionText, { color: colors.secondaryText }]}>{item.commentCount}</ThemedText>
        </View>
        <TouchableOpacity style={[styles.shareButton]} activeOpacity={0.75}>
          <MaterialIcons name="share" size={18} color={colors.text} />
          <ThemedText style={[styles.shareText, { color: colors.text }]}>Share</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header with no gap after nav bar */}
      <View style={[styles.header, { paddingTop: ins.top + 8 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerSide}>
            <TouchableOpacity hitSlop={12} onPress={() => router.push('/settings')}>
              <MaterialIcons name="tune" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={12} onPress={() => router.push('/message/messages')}>
              <View>
                <MaterialIcons name="notifications-none" size={22} color={colors.text} />
                <View style={styles.bellDot} />
              </View>
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.logo, { color: colors.text }]}>BIKERHUB</ThemedText>

          <View style={styles.headerSide}>
            <TouchableOpacity hitSlop={12} onPress={() => router.push('/chat/chats')}>
              <MaterialIcons name="chat-bubble-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={12} onPress={() => router.push('/profile')}>
              <MaterialIcons name="person-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderPost}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            {/* Tabs Row - Center Aligned */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabButton]}
                activeOpacity={0.85}
                onPress={() => router.push('/group/explore')}
              >
                <MaterialIcons name="groups" size={22} color={colors.secondaryText} />
                <ThemedText style={[styles.tabLabel, { color: colors.secondaryText }]}>Groups</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton]}
                activeOpacity={0.85}
                onPress={() => router.push('/challenge/current')}
              >
                <MaterialIcons name="emoji-events" size={22} color={colors.secondaryText} />
                <ThemedText style={[styles.tabLabel, { color: colors.secondaryText }]}>Challenge</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton]}
                activeOpacity={0.85}
                onPress={() => router.push('/marketplace')}
              >
                <MaterialIcons name="storefront" size={22} color={colors.secondaryText} />
                <ThemedText style={[styles.tabLabel, { color: colors.secondaryText }]}>Marketplace</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabButton}
                activeOpacity={0.85}
                onPress={() => router.push('/directory/directory')}
              >
                <MaterialIcons name="folder-open" size={22} color={colors.secondaryText} />
                <ThemedText style={[styles.tabLabel, { color: colors.secondaryText }]}>Directory</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Updated Create Post Box with border and background */}
            <TouchableOpacity 
              style={[
                styles.createBox, 
                { 
                  backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                  borderColor: colors.border,
                }
              ]} 
              activeOpacity={0.8}
              onPress={() => router.push('/social/create')}
            >
              <MaterialIcons name="edit" size={20} color={colors.secondaryText} />
              <ThemedText style={[styles.createPlaceholder, { color: colors.secondaryText }]}>Write your post ...</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={[styles.list, { paddingBottom: ins.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />}
        ListFooterComponent={loading && posts.length > 0 ? <View style={styles.loadingFooter}><MaterialIcons name="hourglass-empty" size={20} color={colors.secondaryText} /></View> : null}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.secondaryText }]}>{'No posts yet. Pull down to refresh.'}</ThemedText>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 4 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSide: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { fontSize: 17, fontWeight: '700', letterSpacing: 3 },
  bellDot: { position: 'absolute', top: 1, right: 1, width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF3B30' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  welcome: { fontSize: 15, fontWeight: '600' },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weatherText: { fontSize: 12, color: '#AAAAAA' },
  createBox: {
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  createPlaceholder: { fontSize: 15, flex: 1 },
  tabsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 2,
  },
  listHeader: { width: '100%', paddingHorizontal: 0 },
  tabButton: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 2,
    borderRadius: 16,
    minWidth: 68,
  },
  tabLabel: { fontSize: 11, textAlign: 'center' },
  list: { paddingHorizontal: 12, gap: 12, paddingTop: 10 },
  postCard: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', padding: 12, gap: 4 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorLink: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 999, backgroundColor: '#CCCCCC' },
  postMeta: { flex: 1 },
  authorName: { fontSize: 16, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontSize: 12 },
  postContent: { fontSize: 15, lineHeight: 22 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  postImage: { borderRadius: 4, backgroundColor: '#222222' },
  singleImage: { width: '100%', height: 200 },
  multiImage: { width: '48%', height: 140 },
  postActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  actionBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13 },
  shareButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
  shareText: { fontSize: 13, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 14 },
  loadingFooter: { padding: 16, alignItems: 'center' },
});