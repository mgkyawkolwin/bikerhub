import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { container, MessageServiceToken } from '@/services';
import type { MessageService } from '@/services';
import Message from '@/models/message';

export default function MessageDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const messageService = useMemo(() => container.resolve<MessageService>(MessageServiceToken), []);
  const [message, setMessage] = useState<Message | null>(null);
  const [markingUnread, setMarkingUnread] = useState(false);

  const messageId = typeof params.messageId === 'string' ? params.messageId : '';

  useEffect(() => {
    if (!messageId) return;
    let active = true;
    const loadMessage = async () => {
      const response = await messageService.getMessageById(messageId);
      if (!response.ok) {
        console.error(`Failed to fetch message: ${response.status} - ${response.statusText}`);
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.success) {
        console.error(`Failed to fetch message: ${responseJson.message}`);
        return;
      }
      const detail = responseJson.data as Message;
      if (active && detail) {
        setMessage(detail);
        void messageService.markMessageAsRead(messageId);
      }
    };
    void loadMessage();
    return () => {
      active = false;
    };
  }, [messageId, messageService]);

  const handleMarkUnread = async () => {
    if (!messageId) return;
    setMarkingUnread(true);
    try {
      const response = await messageService.markMessageAsUnread(messageId);
      if (!response.ok) {
        console.error(`Failed to mark message as unread: ${response.status} - ${response.statusText}`);
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.success) {
        console.error(`Failed to mark message as unread: ${responseJson.message}`);
        return;
      }
      setMessage((prev) => (prev ? { ...prev, read: false } : prev));
      router.back();
    } catch (error) {
      console.error('Unable to mark message as unread.', error);
    } finally {
      setMarkingUnread(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Message</Text>
          <TouchableOpacity
            onPress={handleMarkUnread}
            hitSlop={14}
            disabled={markingUnread}
            style={[styles.markUnreadButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.markUnreadText, { color: colors.text }]}> {markingUnread ? 'Marking...' : 'Mark Unread'} </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {message ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{message.title}</Text>
              <Text style={[styles.cardTime, { color: colors.secondaryText }]}> 
                {message.dateTimeUTC ? new Date(message.dateTimeUTC).toLocaleString() : ''}
              </Text>
            </View>
            <Text style={[styles.cardBody, { color: colors.text }]}>{message.body}</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Loading message...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1,
   },
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
  markUnreadButton: {
    minWidth: 100,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  markUnreadText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 12,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
