import React, { useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import type Comment from '@/models/comment';

export interface SocialCommentModalProps {
  visible: boolean;
  comments: Comment[];
  commentsLoading: boolean;
  replyToCommentAuthor?: string | null;
  commentInput: string;
  onClose: () => void;
  onClearReply: () => void;
  onReply: (commentId: string, authorName: string) => void;
  onDeleteComment: (commentId?: string) => void;
  onCommentInputChange: (value: string) => void;
  onCommentSubmit: () => void;
}

export default function SocialCommentModal({
  visible,
  comments,
  commentsLoading,
  replyToCommentAuthor,
  commentInput,
  onClose,
  onClearReply,
  onReply,
  onDeleteComment,
  onCommentInputChange,
  onCommentSubmit,
}: SocialCommentModalProps) {
  const { colors } = useThemeContext();

  const commentScrollRef = useRef<ScrollView | null>(null);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {replyToCommentAuthor ? (
            <View style={[styles.replyBanner, { borderColor: colors.border }]}> 
              <Text style={[styles.replyText, { color: colors.text }]}>Replying to {replyToCommentAuthor}</Text>
              <TouchableOpacity onPress={onClearReply}>
                <Text style={[styles.clearReplyText, { color: colors.accent }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <ScrollView
            ref={commentScrollRef}
            contentContainerStyle={styles.commentList}
            onContentSizeChange={() => {
              if (comments.length) {
                commentScrollRef.current?.scrollToEnd({ animated: true });
              }
            }}
          >
            {commentsLoading ? (
              <Text style={[styles.commentStatusText, { color: colors.secondaryText }]}>Loading comments...</Text>
            ) : comments.length === 0 ? (
              <Text style={[styles.commentStatusText, { color: colors.secondaryText }]}>No comments yet.</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id ?? `${comment.createdById}-${comment.createdAtUTC}` } style={[styles.commentBlock, { borderColor: colors.border }]}> 
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentAuthor, { color: colors.text }]}>{comment.createdByName}</Text>
                    <Text style={[styles.commentTime, { color: colors.secondaryText }]}>{new Date(comment.createdAtUTC ?? '').toLocaleString('sv-SE')}</Text>
                  </View>
                  <Text style={[styles.commentContent, { color: colors.text }]}>{comment.content}</Text>
                  <View style={styles.commentActionsRow}>
                    <TouchableOpacity style={styles.commentActionButton} onPress={() => onReply(comment.id ?? '', comment.createdByName ?? 'Author')}>
                      <Text style={[styles.commentReplyText, { color: colors.accent }]}>Reply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.commentActionButton} onPress={() => onDeleteComment(comment.id)}>
                      <Text style={[styles.commentDeleteText, { color: '#FF3B30' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  {comment.replies?.map((reply) => (
                    <View key={reply.id ?? `${reply.createdById}-${reply.createdAtUTC}`} style={[styles.replyBlock, { borderColor: colors.border }]}> 
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
          </ScrollView>

          <View style={[styles.commentInputContainer, { borderColor: colors.border }]}> 
            <TextInput
              style={[styles.commentInput, { color: colors.text }]}
              placeholder="Write a comment..."
              placeholderTextColor={colors.secondaryText}
              value={commentInput}
              onChangeText={onCommentInputChange}
              multiline
            />
            <TouchableOpacity style={styles.commentSendButton} onPress={onCommentSubmit} activeOpacity={0.8}>
              <MaterialIcons name="send" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  commentList: { flexGrow: 1, paddingBottom: 12 },
  commentStatusText: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  commentBlock: { padding: 12, borderWidth: 1, borderRadius: 16, marginBottom: 12 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  commentAuthor: { fontSize: 14, fontWeight: '700' },
  commentTime: { fontSize: 12 },
  commentContent: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  commentActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  commentActionButton: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  commentReplyText: { fontSize: 13, fontWeight: '700' },
  commentDeleteText: { fontSize: 13, fontWeight: '700' },
  replyBlock: { padding: 10, borderWidth: 1, borderRadius: 14, marginTop: 10, marginLeft: 16 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  commentInput: { flex: 1, fontSize: 14, minHeight: 40, maxHeight: 120 },
  commentSendButton: { marginLeft: 10, padding: 10, borderRadius: 999, backgroundColor: '#007AFF' },
});
