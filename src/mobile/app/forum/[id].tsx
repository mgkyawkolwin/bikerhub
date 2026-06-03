import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import type ForumPost from '@/models/forumPost';
import type { ForumReply } from '@/models/forumPost';
import initialData from '@/services/mockdata';

export default function ForumDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
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
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t.Title.forums}</Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          {forum ? (
            <>
              <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={styles.postHeader}>
                  <Text style={[styles.postTitle, { color: colors.text }]}>{forum.title}</Text>
                  <View style={styles.postMetaRow}>
                    <Text style={[styles.postMeta, { color: colors.secondaryText }]}>{forum.author}</Text>
                    <Text style={[styles.postMeta, { color: colors.secondaryText }]}>{new Date(forum.postedAt).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={[styles.postExcerpt, { color: colors.secondaryText }]}>{forum.excerpt}</Text>
                <View style={styles.postStats}>
                  <View style={styles.postStatItem}>
                    <MaterialIcons name="visibility" size={14} color={colors.secondaryText} />
                    <Text style={[styles.postStatText, { color: colors.secondaryText }]}>{forum.views} views</Text>
                  </View>
                  <View style={styles.postStatItem}>
                    <MaterialIcons name="chat-bubble-outline" size={14} color={colors.secondaryText} />
                    <Text style={[styles.postStatText, { color: colors.secondaryText }]}>{replies.length} replies</Text>
                  </View>
                </View>
              </View>

              <View style={styles.repliesSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Replies</Text>
                {replies.map((reply) => (
                  <View key={reply.id} style={[styles.replyCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                    <View style={styles.replyHeader}>
                      <Text style={[styles.replyAuthor, { color: colors.text }]}>{reply.author}</Text>
                      <Text style={[styles.replyTime, { color: colors.secondaryText }]}>{new Date(reply.postedAt).toLocaleString()}</Text>
                    </View>
                    <Text style={[styles.replyText, { color: colors.secondaryText }]}>{reply.content}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.replyInputSection}>
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Write a reply..."
                  placeholderTextColor={colors.secondaryText}
                  style={[styles.replyInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity style={[styles.replyButton, { backgroundColor: colors.accent }]} onPress={handleReply} activeOpacity={0.85}>
                  <Text style={styles.replyButtonText}>Reply</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Forum thread not found.</Text>
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
