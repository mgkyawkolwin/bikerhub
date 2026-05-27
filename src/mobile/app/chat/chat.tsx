import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { container, ChatServiceToken } from '@/services';
import type { ChatService } from '@/services';
import ChatMessage from '@/models/chatMesage';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const chatService = useMemo(() => container.resolve<ChatService>(ChatServiceToken), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const friendId = typeof params.friendId === 'string' ? params.friendId : '';

  useEffect(() => {
    if (!friendId) {
      setMessages([]);
      return;
    }

    let active = true;
    const loadMessages = async () => {
      setLoading(true);
      const paginatedData = await chatService.getChatMessages(friendId);
      if (active) {
        setMessages(paginatedData.items);
      }
      if (friendId) {
        await chatService.markChatMessageAsRead(friendId);
      }
      setLoading(false);
    };

    void loadMessages();

    return () => {
      active = false;
    };
  }, [friendId, chatService]);

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#F7F7F7',
      card: isDark ? '#181818' : '#FFFFFF',
      border: isDark ? '#2B2B2B' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const handleSend = async () => {
    if (!friendId) return;
    const text = draft.trim();
    if (!text) return;

    const message = await chatService.sendChatMessage(friendId, text);
    setMessages((prev) => [...prev, message]);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <ThemedText style={[styles.chatTitle, { color: colors.primary }]} numberOfLines={1}>{friendId}</ThemedText>
          <ThemedText style={[styles.chatSubtitle, { color: colors.secondary }]}>Online</ThemedText>
        </View>
        <TouchableOpacity hitSlop={14} style={styles.callButton}>
          <MaterialIcons name="call" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={styles.loading} size="small" color={colors.primary} />
        ) : (
          messages.map((message) => {
            const currentUserId = '00000000-0000-0000-0000-000000000000';
            const isMine = message.senderId === currentUserId;
            const displayTime = message.messageDateTimeUTC
              ? new Date(message.messageDateTimeUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';
            const statusIcon = isMine
              ? message.read
                ? 'visibility'
                : 'done-all'
              : undefined;
            return (
              <View key={message.id} style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
                <View style={[styles.messageBubble, { backgroundColor: isMine ? colors.accent : colors.card, alignSelf: isMine ? 'flex-end' : 'flex-start' }]}> 
                  <ThemedText style={[styles.messageText, { color: '#FFFFFF' }]}>{message.textMessage}</ThemedText>
                  <View style={styles.messageFooter}>
                    <ThemedText style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.8)' : colors.secondary }]}>{displayTime}</ThemedText>
                    <View style={styles.messageIcons}>
                      {statusIcon ? (
                        <MaterialIcons
                          name={statusIcon}
                          size={14}
                          color={isMine ? '#FFFFFF' : colors.secondary}
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.card }]}> 
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="image" size={22} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="videocam" size={22} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="attach-file" size={22} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="keyboard-voice" size={22} color={colors.accent} />
        </TouchableOpacity>
        <TextInput
          style={[styles.textInput, { color: colors.primary, borderColor: colors.border, backgroundColor: colors.background }]}
          placeholder={t.Title.typeMessage ?? 'Type a message...'}
          placeholderTextColor={colors.secondary}
          value={draft}
          onChangeText={setDraft}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.accent }]} onPress={handleSend} hitSlop={10}>
          <MaterialIcons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
    paddingHorizontal: 12,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  chatSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  callButton: {
    padding: 10,
    borderRadius: 18,
  },
  messages: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  messageRow: {
    maxWidth: '100%',
  },
  messageRowLeft: {
    alignItems: 'flex-start',
  },
  messageRowRight: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    borderRadius: 18,
    padding: 14,
    minWidth: 90,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  messageIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  loading: {
    marginTop: 16,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
