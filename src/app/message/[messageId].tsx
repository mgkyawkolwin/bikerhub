import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { container, MessageServiceToken } from '@/services';
import type { MessageService, MessageDetail } from '@/services';

export default function MessageDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const messageService = useMemo(() => container.resolve<MessageService>(MessageServiceToken), []);
  const [message, setMessage] = useState<MessageDetail | null>(null);

  const messageId = typeof params.messageId === 'string' ? params.messageId : '';

  const colors = {
    background: isDark ? '#000000' : '#F7F7F7',
    card: isDark ? '#181818' : '#FFFFFF',
    border: isDark ? '#2B2B2B' : '#E0E0E0',
    primary: isDark ? '#FFFFFF' : '#000000',
    secondary: isDark ? '#B0B0B0' : '#666666',
    accent: '#E85D04',
  };

  useEffect(() => {
    if (!messageId) return;
    let active = true;
    const loadMessage = async () => {
      const detail = await messageService.getMessageById(messageId);
      if (active && detail) {
        setMessage(detail);
        void messageService.markAsRead(messageId);
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
            <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: colors.primary }]}>Message</ThemedText>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {message ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.cardHeader}>
              <ThemedText style={[styles.cardTitle, { color: colors.primary }]}>{message.title}</ThemedText>
              <ThemedText style={[styles.cardTime, { color: colors.secondary }]}>{message.time}</ThemedText>
            </View>
            <ThemedText style={[styles.cardSender, { color: colors.secondary }]}>From {message.sender}</ThemedText>
            <ThemedText style={[styles.cardBody, { color: colors.primary }]}>{message.body}</ThemedText>
            <View style={styles.messageStatus}>
              <MaterialIcons
                name={message.status === 'seen' ? 'visibility' : 'arrow-forward'}
                size={18}
                color={colors.accent}
              />
              <ThemedText style={[styles.statusText, { color: colors.secondary }]}>{message.status}</ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.primary }]}>Loading message...</ThemedText>
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
