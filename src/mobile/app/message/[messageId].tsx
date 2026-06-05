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

  const messageId = typeof params.messageId === 'string' ? params.messageId : '';

  useEffect(() => {
    if (!messageId) return;
    let active = true;
    const loadMessage = async () => {
      const detail = await messageService.getMessageById(messageId);
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Message</Text>
          <View style={styles.placeholder} />
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
            <View style={styles.messageStatus}>
              <MaterialIcons
                name={message.read ? 'visibility' : 'arrow-forward'}
                size={18}
                color={colors.accent}
              />
              <Text style={[styles.statusText, { color: colors.secondaryText }]}> {message.read ? 'Read' : 'Unread'}</Text>
            </View>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  cardTime: {
    fontSize: 11,
  },
  cardSender: {
    fontSize: 13,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
