import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Text
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { container, ChatServiceToken } from '@/services';
import type { ChatService } from '@/services';
import ChatHead from '@/models/chatHead';
import { useAuthContext } from '@/hooks/use-auth-context';


export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeContext();
  const { t } = useI18n();
  const chatService = useMemo(() => container.resolve<ChatService>(ChatServiceToken), []);
  const [threads, setThreads] = useState<ChatHead[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { getAuthUser } = useAuthContext();
  const authUser = getAuthUser();

  const loadThreads = useCallback(
    async (nextPage: number, replace = false) => {
      if (replace) {
        setRefreshing(true);
      } else if (nextPage > 1) {
        setLoadingMore(true);
      } else {
        setInitialLoading(true);
      }

      try {
        const pageData = await chatService.getChatHeads(nextPage, pageSize);
        setThreads((prev) => (replace || nextPage === 1 ? pageData.items : [...prev, ...pageData.items]));
        setPage(pageData.page);
        setTotalPages(pageData.totalPages);
      } finally {
        setRefreshing(false);
        setLoadingMore(false);
        setInitialLoading(false);
      }
    },
    [chatService, pageSize],
  );

  useEffect(() => {
    void loadThreads(1, true);
  }, [loadThreads]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t.Title.chats ?? 'Chats'}</Text>
          <TouchableOpacity onPress={() => {}} hitSlop={14} style={styles.iconButton}>
            <MaterialIcons name="search" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadThreads(1, true)}
            tintColor={colors.text}
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && page < totalPages) {
            loadThreads(page + 1, false);
          }
        }}
        ListFooterComponent={() => {
          if (!loadingMore) return null;
          return <ActivityIndicator style={styles.loadingMore} size="small" color={colors.text} />;
        }}
        ListEmptyComponent={() => {
          if (!initialLoading) {
            return (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.text }]}>No chats available.</Text>
              </View>
            );
          }
          return null;
        }}
        renderItem={({ item: chat }) => (
          <TouchableOpacity
            style={[styles.chatItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.75}
            onPress={() => router.push(`/chat/chat?friendId=${chat.friendId}`)}
          >
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}> 
              <Text style={styles.avatarText}>{chat.friendName?.charAt(0)}</Text>
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={[styles.chatName, { color: colors.text }]}>{chat.friendName}</Text>
                <Text style={[styles.chatTime, { color: colors.secondaryText }]}>{new Date(chat.messageDateTimeUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <View style={styles.chatRow}>
                <Text style={[styles.chatPreview, { color: colors.secondaryText }]} numberOfLines={1}>{chat.textMessage}</Text>
                {chat.unreadCount ? (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}> 
                    <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  loadingMore: {
    marginVertical: 12,
  },
  chatItem: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    gap: 6,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
  },
  chatTime: {
    fontSize: 11,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chatPreview: {
    flex: 1,
    fontSize: 13,
  },
  unreadBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
