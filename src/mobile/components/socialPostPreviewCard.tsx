import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import type Post from '@/models/post';

export interface SocialPostPreviewCardProps {
  post: Post;
}

export default function SocialPostPreviewCard({ post }: SocialPostPreviewCardProps) {
  const { colors } = useThemeContext();

  return (
    <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>      
      <View style={styles.postHeader}>
        <View style={styles.authorLink}>
          <Image source={{ uri: post.createdByUserProfilePhotoUrl ?? '' }} style={styles.avatar} />
          <View style={styles.postMeta}>
            <Text style={[styles.authorName, { color: colors.text }]}>{post.createdByDisplayName}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={12} color={colors.secondaryText} />
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                {new Date(post.createdAtUTC ?? '').toLocaleDateString('sv-SE')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>

      {post.medias?.length ? (
        <View style={styles.imageGrid}>
          {post.medias.map((item, idx) => (
            <Image
              key={`${post.id}-preview-${idx}`}
              source={{ uri: item.url ?? '' }}
              style={[styles.postImage, post.medias?.length === 1 ? styles.singleImage : styles.multiImage]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 12,
    gap: 4,
    marginTop: 10,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  authorLink: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: '#CCCCCC' },
  postMeta: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontSize: 12 },
  postContent: { fontSize: 14, lineHeight: 20 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  postImage: { borderRadius: 4, backgroundColor: '#222222' },
  singleImage: { width: '100%', height: 200 },
  multiImage: { width: '48%', height: 120 },
});
