import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { container, MessageServiceToken } from '@/services';
import type { MessageService } from '@/services';
import Message from '@/models/message';
import SnackBar from '@/components/snackbar';


export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeContext();
  const { t } = useI18n();
  const messageService = useMemo(() => container.resolve<MessageService>(MessageServiceToken), []);
  const [items, setItems] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const loadMessages = useCallback(
    async (nextPage: number, replace = false) => {
      if (replace) {
        setRefreshing(true);
      } else if (nextPage > 1) {
        setLoadingMore(true);
      } else {
        setInitialLoading(true);
      }

      try {
        const response = await messageService.getMessages(nextPage, pageSize);
        if (!response.ok) {
          SnackBar.Error(`${response.status} - ${response.statusText} : Invalid server resposne. Please try again.`);
          return;
        }
        const responseJson = await response.json();
        if (!responseJson.success) {
          SnackBar.Error(responseJson.message || 'Failed to load messages. Please try again.');
          return;
        }
        const pageData = responseJson.data;
        setItems((prev) => (replace || nextPage === 1 ? pageData.items : [...prev, ...pageData.items]));
        setPage(pageData.page);
        setTotalPages(pageData.totalPages);
      } finally {
        setRefreshing(false);
        setLoadingMore(false);
        setInitialLoading(false);
      }
    },
    [messageService, pageSize],
  );

  useEffect(() => {
    void loadMessages(1, true);
  }, [loadMessages]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
          <TouchableOpacity
            onPress={async () => {
              setMarkingAllRead(true);
              try {
                const response = await messageService.markAllMessagesAsRead();
                if (!response.ok) {
                  SnackBar.Error(`${response.status} - ${response.statusText}. Failed to mark all messages as read.`);
                  return;
                }
                const json = await response.json();
                if (!json.success) {
                  SnackBar.Error(json.message || 'Failed to mark all messages as read.');
                  return;
                }
                SnackBar.Success('All messages marked as read.');
                void loadMessages(1, true);
              } catch (error) {
                SnackBar.Error('Unable to mark all messages as read. Please try again.');
              } finally {
                setMarkingAllRead(false);
              }
            }}
            hitSlop={14}
            disabled={markingAllRead}
            style={[styles.markAllButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.markAllText, { color: colors.text }]}>
              {markingAllRead ? 'Marking...' : 'Mark All Read'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMessages(1, true)}
            tintColor={colors.text}
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && page < totalPages) {
            void loadMessages(page + 1, false);
          }
        }}
        ListFooterComponent={() => (loadingMore ? <ActivityIndicator style={styles.loadingMore} size="small" color={colors.text} /> : null)}
        ListEmptyComponent={() =>
          !initialLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text }]}>No messages found.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const displayDate = item.dateTimeUTC ? new Date(item.dateTimeUTC).toLocaleDateString() : '';
          const previewText = item.body ? item.body : '';
          return (
            <TouchableOpacity
              style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/message/[messageId]', params: { messageId: item.id } })}
            >
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.itemTime, { color: colors.secondaryText }]}>{displayDate}</Text>
              </View>
              <View style={styles.itemFooter}>
                <Text style={[styles.itemPreview, { color: colors.secondaryText }]} numberOfLines={2}>{previewText}</Text>
                {!item.read ? (
                  <View style={[styles.unread, { backgroundColor: colors.accent }]}>
                    <Text style={styles.unreadText}>NEW</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
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
  placeholder: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  markAllButton: {
    minWidth: 110,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  item: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  itemTime: {
    fontSize: 11,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemPreview: {
    flex: 1,
    fontSize: 13,
  },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  loadingMore: {
    marginVertical: 12,
  },
});
