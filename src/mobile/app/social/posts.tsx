import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container } from '@/services';
import { SocialPostServiceToken } from '@/services/socialPostService';
import { SocialCommentServiceToken } from '@/services/socialCommentService';
import type { SocialPostService } from '@/services/socialPostService';
import type { SocialCommentService } from '@/services/socialCommentService';
import type Post from '@/models/post';
import type Comment from '@/models/comment';
import SnackBar from '@/components/snackbar';

export default function SocialPostsScreen() {
  const ins = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const socialPostService = useMemo(() => container.resolve<SocialPostService>(SocialPostServiceToken), []);
  const { getAuthUser } = useAuthContext();

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyToCommentAuthor, setReplyToCommentAuthor] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const socialCommentService = useMemo(() => container.resolve<SocialCommentService>(SocialCommentServiceToken), []);

  const loadPosts = useCallback(
    async (pageNumber: number, reset = false) => {
      setLoading(true);
      try {
        const response = await socialPostService.getPosts(pageNumber, 10);
        if (!response.ok) {
          SnackBar.Error(
            'Failed to load posts.'
          );
          return;
        }
        const result = await response.json();
        console.log('Loaded posts:', { pageNumber, result });
        if(!result.success) {
          SnackBar.Error(
            result.message || 'Failed to load posts.'
          );
          return;
        }
        setPosts((prev) => (reset ? result.data.items : [...prev, ...result.data.items]));
        setPage(result.data.page);
        setTotal(result.data.total);
      } catch (error) {
        SnackBar.Error('Failed to load posts.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [socialPostService],
  );

  const loadComments = useCallback(
    async (postId: string) => {
      setCommentsLoading(true);
      try {
        const response = await socialCommentService.getComments(postId);
        if (!response.ok) {
          SnackBar.Error('Unable to load comments.');
          return;
        }

        const result = await response.json();
        if (!result.success) {
          SnackBar.Error(result.message || 'Unable to load comments.');
          return;
        }

        setComments(result.data ?? []);
      } catch {
        SnackBar.Error('Unable to load comments.');
      } finally {
        setCommentsLoading(false);
      }
    },
    [socialCommentService],
  );

  const openComments = async (postId: string) => {
    setSelectedPostId(postId);
    setReplyToCommentId(null);
    setReplyToCommentAuthor(null);
    setCommentInput('');
    await loadComments(postId);
  };

  const closeComments = () => {
    setSelectedPostId(null);
    setReplyToCommentId(null);
    setReplyToCommentAuthor(null);
    setCommentInput('');
  };

  const handleCommentSubmit = async () => {
    if (!selectedPostId || !commentInput.trim()) {
      return;
    }

    try {
      const response = await socialCommentService.createComment(selectedPostId, commentInput.trim(), replyToCommentId);
      if (!response.ok) {
        SnackBar.Error('Unable to post comment.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to post comment.');
        return;
      }

      setCommentInput('');
      setReplyToCommentId(null);
      setReplyToCommentAuthor(null);
      await loadComments(selectedPostId);
      setPosts((prev) => prev.map((post) => (post.id === selectedPostId ? { ...post, commentCount: (post.commentCount ?? 0) + 1 } : post)));
    } catch {
      SnackBar.Error('Unable to post comment.');
    }
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyToCommentId(commentId);
    setReplyToCommentAuthor(authorName);
  };

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

  const handleToggleLove = async (postId?: string) => {
    if (!postId) {
      return;
    }

    const currentUserId = getAuthUser()?.id ?? '';

    try {
      const response = await socialPostService.toggleLove(postId);
      if (!response.ok) {
        SnackBar.Error('Unable to update love status.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to update love status.');
        return;
      }

      const updatedPost = result.data as Post;
      setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post)));
    } catch (error) {
      SnackBar.Error('Unable to update love status.');
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.authorLink}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: '/social/profile', params: { userId: item.createdById ?? '' } })}
        >
          <Image source={{ uri: item.authorAvatarUrl ?? '' }} style={styles.avatar} />
          <View style={styles.postMeta}>
              <Text style={[styles.authorName, { color: colors.text }]}>{item.createdByName}</Text>
              <View style={styles.metaRow}>
                <MaterialIcons name="schedule" size={12} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{new Date(item.createdAtUTC ?? '').toLocaleDateString("sv-SE")}</Text>
              </View>
            </View>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.actionBlock} activeOpacity={0.75} onPress={() => void handleToggleLove(item.id)}>
          <MaterialIcons
            name={item.isLikedByCurrentUser ? 'favorite' : 'favorite-border'}
            size={18}
            color={item.isLikedByCurrentUser ? '#FF3B30' : colors.secondaryText}
          />
          <Text style={[styles.actionText, { color: item.isLikedByCurrentUser ? '#FF3B30' : colors.secondaryText }]}>{item.loveCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBlock} activeOpacity={0.75} onPress={() => void openComments(item.id ?? '')}>
          <MaterialIcons name="comment" size={18} color={colors.secondaryText} />
          <Text style={[styles.actionText, { color: colors.secondaryText }]}>{item.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shareButton]} activeOpacity={0.75}>
          <MaterialIcons name="share" size={18} color={colors.text} />
          <Text style={[styles.shareText, { color: colors.text }]}>Share</Text>
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

          <Text style={[styles.logo, { color: colors.text }]}>BIKERHUB</Text>

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
                <Text style={[styles.tabLabel, { color: colors.secondaryText }]}>Groups</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton]}
                activeOpacity={0.85}
                onPress={() => router.push('/challenge/current')}
              >
                <MaterialIcons name="emoji-events" size={22} color={colors.secondaryText} />
                <Text style={[styles.tabLabel, { color: colors.secondaryText }]}>Challenge</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton]}
                activeOpacity={0.85}
                onPress={() => router.push('/marketplace')}
              >
                <MaterialIcons name="storefront" size={22} color={colors.secondaryText} />
                <Text style={[styles.tabLabel, { color: colors.secondaryText }]}>Marketplace</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabButton}
                activeOpacity={0.85}
                onPress={() => router.push('/directory/directory')}
              >
                <MaterialIcons name="folder-open" size={22} color={colors.secondaryText} />
                <Text style={[styles.tabLabel, { color: colors.secondaryText }]}>Directory</Text>
              </TouchableOpacity>
            </View>

            {/* Updated Create Post Box with border and background */}
            <TouchableOpacity 
              style={[
                styles.createBox, 
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }
              ]} 
              activeOpacity={0.8}
              onPress={() => router.push('/social/create')}
            >
              <MaterialIcons name="edit" size={20} color={colors.secondaryText} />
              <Text style={[styles.createPlaceholder, { color: colors.secondaryText }]}>Write your post ...</Text>
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
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>{'No posts yet. Pull down to refresh.'}</Text>
          </View>
        ) : null}
      />

      <Modal
        visible={selectedPostId !== null}
        animationType="slide"
        transparent
        onRequestClose={closeComments}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={closeComments} />
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
              <TouchableOpacity onPress={closeComments} hitSlop={12}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {replyToCommentAuthor ? (
              <View style={styles.replyBanner}>
                <Text style={[styles.replyText, { color: colors.text }]}>Replying to {replyToCommentAuthor}</Text>
                <TouchableOpacity onPress={() => { setReplyToCommentId(null); setReplyToCommentAuthor(null); }}>
                  <Text style={[styles.clearReplyText, { color: colors.accent }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.commentList}>
              {commentsLoading ? (
                <Text style={[styles.commentStatusText, { color: colors.secondaryText }]}>Loading comments...</Text>
              ) : comments.length === 0 ? (
                <Text style={[styles.commentStatusText, { color: colors.secondaryText }]}>No comments yet.</Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={[styles.commentBlock, { borderColor: colors.border }]}> 
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentAuthor, { color: colors.text }]}>{comment.createdByName}</Text>
                      <Text style={[styles.commentTime, { color: colors.secondaryText }]}>{new Date(comment.createdAtUTC ?? '').toLocaleString('sv-SE')}</Text>
                    </View>
                    <Text style={[styles.commentContent, { color: colors.text }]}>{comment.content}</Text>
                    <TouchableOpacity style={styles.commentReplyButton} onPress={() => handleReply(comment.id ?? '', comment.createdByName ?? 'Author')}>
                      <Text style={[styles.commentReplyText, { color: colors.accent }]}>Reply</Text>
                    </TouchableOpacity>
                    {comment.replies?.map((reply) => (
                      <View key={reply.id} style={[styles.replyBlock, { borderColor: colors.border }]}> 
                        <View style={styles.commentHeader}>
                          <Text style={[styles.commentAuthor, { color: colors.text }]}>{reply.createdByName}</Text>
                          <Text style={[styles.commentTime, { color: colors.secondaryText }]}>{new Date(reply.createdAtUTC ?? '').toLocaleString('sv-SE')}</Text>
                        </View>
                        <Text style={[styles.commentContent, { color: colors.text }]}>{reply.content}</Text>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </View>
            <View style={[styles.commentInputContainer, { borderColor: colors.border }]}> 
              <TextInput
                style={[styles.commentInput, { color: colors.text }]}
                placeholder="Write a comment..."
                placeholderTextColor={colors.secondaryText}
                value={commentInput}
                onChangeText={setCommentInput}
                multiline
              />
              <TouchableOpacity style={styles.commentSendButton} onPress={handleCommentSubmit} activeOpacity={0.8}>
                <MaterialIcons name="send" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { flex: 1 },
  modalContent: {
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    minHeight: 280,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  replyBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 14, marginBottom: 12, borderWidth: 1 },
  replyText: { fontSize: 13 },
  clearReplyText: { fontSize: 13, fontWeight: '700' },
  commentList: { flexGrow: 1 },
  commentStatusText: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  commentBlock: { padding: 12, borderWidth: 1, borderRadius: 16, marginBottom: 12 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  commentAuthor: { fontSize: 14, fontWeight: '700' },
  commentTime: { fontSize: 12 },
  commentContent: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  commentReplyButton: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  commentReplyText: { fontSize: 13, fontWeight: '700' },
  replyBlock: { padding: 10, borderWidth: 1, borderRadius: 14, marginTop: 10, marginLeft: 16 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  commentInput: { flex: 1, fontSize: 14, minHeight: 40, maxHeight: 120 },
  commentSendButton: { marginLeft: 10, padding: 10, borderRadius: 999, backgroundColor: '#007AFF' },
});