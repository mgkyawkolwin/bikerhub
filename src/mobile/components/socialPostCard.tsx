import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { SocialPostServiceToken } from '@/services/socialPostService';
import type { SocialPostService } from '@/services/socialPostService';
import type Post from '@/models/post';
import SocialPostPreviewCard from '@/components/socialPostPreviewCard';

export interface SocialPostCardProps {
  post: Post;
  onAuthorPress?: () => void;
  onToggleLove: (postId?: string) => void;
  onOpenComments: (postId?: string) => void;
  onSharePress?: () => void;
  onMenuPress?: () => void;  // Added for three-dot menu
}

export default function SocialPostCard({
  post,
  onAuthorPress,
  onToggleLove,
  onOpenComments,
  onSharePress,
  onMenuPress,  // Added
}: SocialPostCardProps) {
  const { colors } = useThemeContext();
  const socialPostService = useMemo(() => container.resolve<SocialPostService>(SocialPostServiceToken), []);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const previewPostId = useMemo(() => {
    const match = post.content?.match(/bikerhub:\/\/posts\/([0-9a-fA-F-]+)/);
    return match?.[1] ?? null;
  }, [post.content]);

  useEffect(() => {
    let isMounted = true;
    setPreviewPost(null);

    if (!previewPostId) {
      return;
    }

    setPreviewLoading(true);
    void socialPostService.getPostById(previewPostId)
      .then(async (response) => {
        if (!isMounted || !response.ok) {
          return;
        }

        const result = await response.json();
        if (!result.success) {
          return;
        }

        setPreviewPost(result.data);
      })
      .catch(() => {
        // ignore preview load failures
      })
      .finally(() => {
        if (isMounted) {
          setPreviewLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [previewPostId, socialPostService]);

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>      
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.authorLink}
          activeOpacity={0.8}
          onPress={onAuthorPress}
        >
          <Image source={{ uri: post.authorAvatarUrl ?? '' }} style={styles.avatar} />
          <View style={styles.postMeta}>
            <Text style={[styles.authorName, { color: colors.text }]}>{post.createdByDisplayName}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={12} color={colors.secondaryText} />
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                {new Date(post.createdAtUTC ?? '').toLocaleDateString('sv-SE')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.7}
          onPress={onMenuPress}
        >
          <MaterialIcons name="more-vert" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>

      {post.imageUrls?.length ? (
        <View style={styles.imageGrid}>
          {post.imageUrls.map((uri, idx) => (
            <Image
              key={`${post.id}-${idx}`}
              source={{ uri }}
              style={[styles.postImage, post.imageUrls?.length === 1 ? styles.singleImage : styles.multiImage]}
            />
          ))}
        </View>
      ) : null}

      {previewPost && !previewLoading ? (
        <SocialPostPreviewCard post={previewPost} />
      ) : null}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBlock} activeOpacity={0.75} onPress={() => onToggleLove(post.id)}>
          <MaterialIcons
            name={post.isLikedByCurrentUser ? 'favorite' : 'favorite-border'}
            size={18}
            color={post.isLikedByCurrentUser ? '#FF3B30' : colors.secondaryText}
          />
          <Text style={[styles.actionText, { color: post.isLikedByCurrentUser ? '#FF3B30' : colors.secondaryText }]}>
            {post.loveCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBlock} activeOpacity={0.75} onPress={() => onOpenComments(post.id)}>
          <MaterialIcons name="comment" size={18} color={colors.secondaryText} />
          <Text style={[styles.actionText, { color: colors.secondaryText }]}>{post.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} activeOpacity={0.75} onPress={onSharePress}>
          <MaterialIcons name="share" size={18} color={colors.text} />
          <Text style={[styles.shareText, { color: colors.text }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', padding: 12, gap: 4 },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  authorLink: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuButton: { 
    padding: 4,
    marginRight: -4,  // Slight negative margin to align perfectly with edge
  },
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
});