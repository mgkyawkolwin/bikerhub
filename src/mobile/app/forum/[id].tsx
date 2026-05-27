import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import type ForumPost from '@/models/forumPost';
import type { ForumReply } from '@/models/forumPost';
import initialData from '@/services/mockdata';

export default function ForumDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';

  const [forum, setForum] = useState<ForumPost | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<ForumReply[]>([]);

  useEffect(() => {
    const forums = (initialData.collections?.forums ?? []) as ForumPost[];
    const selected = forums.find((item) => item.id === id) ?? null;
    setForum(selected);
    setReplies(selected?.replies ?? []);
  }, [id]);

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

  const handleReply = () => {
    if (!replyText.trim()) return;
    const nextReply: ForumReply = {
      id: `reply-${Date.now()}`,
      author: 'You',
      postedAt: new Date().toISOString(),
      content: replyText.trim(),
    };
    setReplies((prev) => [...prev, nextReply]);
    setReplyText('');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, { color: colors.primary }]}>{t.Title.forums}</ThemedText>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          {forum ? (
            <>
              <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={styles.postHeader}>
                  <ThemedText style={[styles.postTitle, { color: colors.primary }]}>{forum.title}</ThemedText>
                  <View style={styles.postMetaRow}>
                    <ThemedText style={[styles.postMeta, { color: colors.secondary }]}>{forum.author}</ThemedText>
                    <ThemedText style={[styles.postMeta, { color: colors.secondary }]}>{new Date(forum.postedAt).toLocaleDateString()}</ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.postExcerpt, { color: colors.secondary }]}>{forum.excerpt}</ThemedText>
                <View style={styles.postStats}>
                  <View style={styles.postStatItem}>
                    <MaterialIcons name="visibility" size={14} color={colors.secondary} />
                    <ThemedText style={[styles.postStatText, { color: colors.secondary }]}>{forum.views} views</ThemedText>
                  </View>
                  <View style={styles.postStatItem}>
                    <MaterialIcons name="chat-bubble-outline" size={14} color={colors.secondary} />
                    <ThemedText style={[styles.postStatText, { color: colors.secondary }]}>{replies.length} replies</ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.repliesSection}>
                <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>Replies</ThemedText>
                {replies.map((reply) => (
                  <View key={reply.id} style={[styles.replyCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                    <View style={styles.replyHeader}>
                      <ThemedText style={[styles.replyAuthor, { color: colors.primary }]}>{reply.author}</ThemedText>
                      <ThemedText style={[styles.replyTime, { color: colors.secondary }]}>{new Date(reply.postedAt).toLocaleString()}</ThemedText>
                    </View>
                    <ThemedText style={[styles.replyText, { color: colors.secondary }]}>{reply.content}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.replyInputSection}>
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Write a reply..."
                  placeholderTextColor={colors.secondary}
                  style={[styles.replyInput, { borderColor: colors.border, color: colors.primary, backgroundColor: colors.card }]}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity style={[styles.replyButton, { backgroundColor: colors.accent }]} onPress={handleReply} activeOpacity={0.85}>
                  <ThemedText style={styles.replyButtonText}>Reply</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>Forum thread not found.</ThemedText>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 20, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, gap: 16, paddingTop: 12 },
  postCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  postHeader: { gap: 8 },
  postTitle: { fontSize: 18, fontWeight: '700' },
  postMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  postMeta: { fontSize: 12 },
  postExcerpt: { fontSize: 15, lineHeight: 22 },
  postStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  postStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postStatText: { fontSize: 12 },
  repliesSection: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  replyCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  replyAuthor: { fontSize: 13, fontWeight: '700' },
  replyTime: { fontSize: 12 },
  replyText: { fontSize: 14, lineHeight: 20 },
  replyInputSection: { gap: 12 },
  replyInput: { minHeight: 120, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14 },
  replyButton: { paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
  replyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  emptyState: { paddingTop: 80, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
