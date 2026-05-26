import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/mobile/i18n';
import { useThemeContext } from '@/mobile/hooks/use-theme-context';
import { ThemedText } from '@/mobile/components/themedText';
import { container } from '@/services';
import { NewsServiceToken } from '@/services/newsService';
import type { NewsService } from '@/services/newsService';
import News from '@/models/news';

export default function NewsArticleDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const newsService = useMemo(() => container.resolve<NewsService>(NewsServiceToken), []);
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const [article, setArticle] = useState<News | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    void (async () => {
      const result = await newsService.getNewsById(id);
      if (active) {
        setArticle(result ?? null);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, newsService]);

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

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Article</ThemedText>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {article ? (
          <View style={[styles.page, { backgroundColor: colors.background }]}> 
            {article.imageUrl ? <Image source={{ uri: article.imageUrl }} style={styles.image} /> : null}
            <View style={styles.textBlock}> 
              <ThemedText style={[styles.headline, { color: colors.primary }]}>{article.headline}</ThemedText>
              <View style={styles.metaRow}>
                <MaterialIcons name="schedule" size={14} color={colors.secondary} />
                <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{new Date(article.dateTimeUTC ?? '').toLocaleDateString()}</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <MaterialIcons name="source" size={14} color={colors.secondary} />
                <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{article.source}</ThemedText>
              </View>
              <ThemedText style={[styles.bodyText, { color: colors.secondary }]}>{article.content ?? article.summary}</ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>{t.Text.noListings}</ThemedText>
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
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
  },
  content: {
    paddingHorizontal: 0,
    gap: 16,
  },
  page: {
    flex: 1,
    gap: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 0,
  },
  textBlock: {
    paddingHorizontal: 16,
    gap: 12,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 14,
  },
});
