import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Text, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { container, ChatServiceToken } from '@/services';
import type { ChatService } from '@/services';
import { useAuthContext } from '@/hooks/use-auth-context';
import ChatMessage from '@/models/chatMesage';
import type SocialProfile from '@/models/socialProfile';
import { SocialServiceClient, SocialServiceToken } from '@/services/socialService';
import SnackBar from '@/components/snackbar';

function ChatVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      style={styles.messageVideo}
      player={player}
      nativeControls
      contentFit="contain"
      allowsPictureInPicture
    />
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const { authUser } = useAuthContext();
  const chatService = useMemo(() => container.resolve<ChatService>(ChatServiceToken), []);
  const socialService = useMemo(() => container.resolve<SocialServiceClient>(SocialServiceToken), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friendProfile, setFriendProfile] = useState<SocialProfile | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const friendId = typeof params.friendId === 'string' ? params.friendId : '';
  const currentUserId = authUser?.id ?? '';

  useEffect(() => {
    if (!friendId) {
      setMessages([]);
      setFriendProfile(null);
      return;
    }

    let active = true;
    const loadMessages = async () => {
      setLoading(true);
      try {
        const paginatedData = await chatService.getChatMessages(friendId);
        if (active) {
          setMessages(paginatedData.items);
        }

        if (currentUserId) {
          await Promise.all(
            paginatedData.items
              .filter((message) => message.receiverId === currentUserId && !message.read && message.id)
              .map((message) => chatService.markChatMessageAsRead(message.id!)),
          );
        }
      } catch (error) {
        SnackBar.Error(error instanceof Error ? error.message : 'Unable to load messages.');
      } finally {
        setLoading(false);
      }
    };

    void loadMessages();

    return () => {
      active = false;
    };
  }, [friendId, chatService, currentUserId]);

  useEffect(() => {
    if (!friendId) {
      setFriendProfile(null);
      return;
    }

    let active = true;
    const loadFriendProfile = async () => {
      try {
        const response = await socialService.getProfileById(friendId);
        if (!active || !response.ok) return;

        const result = await response.json();
        if (!result.success) return;

        setFriendProfile(result.data ?? null);
      } catch (error) {
        console.error('Failed to load friend profile:', error);
      }
    };

    void loadFriendProfile();

    return () => {
      active = false;
    };
  }, [friendId, socialService]);

  const handleSend = async () => {
    if (!friendId) return;
    const text = draft.trim();
    if (!text) return;

    try {
      const message = await chatService.sendChatMessage(friendId, text);
      setMessages((prev) => [...prev, message]);
      setDraft('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  };

  const handlePickMedia = async () => {
    if (!friendId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      SnackBar.Error('Gallery access is required to send media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    const fileName = asset.fileName ?? `chat-media-${Date.now()}`;
    const fileType = asset.type ? `${asset.type}/${asset.uri.split('.').pop()}` : 'application/octet-stream';

    try {
      const message = await chatService.sendChatMediaMessage(friendId, {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      });
      setMessages((prev) => [...prev, message]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      console.error('Failed to send media chat message:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={styles.profileHeader}>
            {friendProfile?.profilePhotoUrl ? (
              <Image source={{ uri: friendProfile.profilePhotoUrl }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileIcon, { backgroundColor: colors.accent }]}> 
                <MaterialIcons name="person" size={20} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.profileTitle}>
              <Text style={[styles.chatTitle, { color: colors.text }]} numberOfLines={1}>
                {friendProfile?.displayName ?? friendId}
                {friendProfile?.userName ? ` (@${friendProfile.userName})` : ''}
              </Text>
              {!friendProfile ? (
                <Text style={[styles.chatSubtitle, { color: colors.secondaryText }]} numberOfLines={1}>
                  Online
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={styles.loading} size="small" color={colors.text} />
        ) : (
          messages.map((message) => {
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
                <View style={[styles.messageBubble, { backgroundColor: isMine ? colors.card : colors.card, alignSelf: isMine ? 'flex-end' : 'flex-start' }]}> 
                  {message.medias?.length ? (
                    message.medias[0].url ? (
                      message.medias[0].contentType?.startsWith('video/') ? (
                        <ChatVideoPlayer uri={message.medias[0].url ?? ''} />
                      ) : (
                        <Image
                          source={{ uri: message.medias[0].url ?? '' }}
                          style={styles.messageImage}
                          resizeMode="contain"
                          onError={({ nativeEvent }) => {
                            console.warn('Chat media image load failed', message.medias?.[0]?.url, nativeEvent);
                          }}
                        />
                      )
                    ) : (
                      <View style={styles.messageMediaFallback}>
                        <Text style={[styles.messageMediaFallbackText, { color: '#FFFFFF' }]}>Unable to load media</Text>
                      </View>
                    )
                  ) : null}
                  {message.textMessage ? (
                    <Text style={[styles.messageText, { color: '#FFFFFF', marginTop: message.medias?.length ? 10 : 0 }]}>
                      {message.textMessage}
                    </Text>
                  ) : null}
                  <View style={styles.messageFooter}>
                    <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.8)' : colors.secondaryText }]}>{displayTime}</Text>
                    <View style={styles.messageIcons}>
                      {statusIcon ? (
                        <MaterialIcons
                          name={statusIcon}
                          size={14}
                          color={isMine ? '#FFFFFF' : colors.secondaryText}
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
        <TouchableOpacity style={styles.iconButton} onPress={handlePickMedia}>
          <MaterialIcons name="image" size={22} color={colors.accent} />
        </TouchableOpacity>
        <TextInput
          style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          placeholder={t.Title.typeMessage ?? 'Type a message...'}
          placeholderTextColor={colors.secondaryText}
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  profileIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTitle: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  chatSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
    minWidth: 120,
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
  messageImage: {
    width: 300,
    maxWidth: '100%',
    alignSelf: 'stretch',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#00000010',
  },
  messageVideo: {
    width: 300,
    maxWidth: '100%',
    alignSelf: 'stretch',
    height: 220,
    borderRadius: 14,
    backgroundColor: '#00000010',
  },
  messageVideoPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageMediaFallback: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  messageMediaFallbackText: {
    fontSize: 13,
    lineHeight: 18,
  },
  videoPlaceholderText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
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
    paddingVertical: 12,
    marginBottom: 10,
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
