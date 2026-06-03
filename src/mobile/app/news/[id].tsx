import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import { container } from '@/services';
import { NewsServiceToken } from '@/services/newsService';
import type { NewsService } from '@/services/newsService';
import News from '@/models/news';

export default function NewsDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
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

  const { colors } = useThemeContext();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>News</ThemedText>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {article ? (
          <View style={styles.page}>
            {article.imageUrl ? <Image source={{ uri: article.imageUrl }} style={styles.image} /> : null}
            <View style={styles.textBlock}>
              <ThemedText style={[styles.headline, { color: colors.text }]}>{article.headline}</ThemedText>
              <View style={styles.metaRow}>
                <MaterialIcons name="schedule" size={14} color={colors.secondaryText} />
                <ThemedText style={[styles.metaText, { color: colors.secondaryText }]}>{new Date(article.dateTimeUTC ?? '').toLocaleDateString()}</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <MaterialIcons name="source" size={14} color={colors.secondaryText} />
                <ThemedText style={[styles.metaText, { color: colors.secondaryText }]}>{article.source}</ThemedText>
              </View>
              <ThemedText style={[styles.bodyText, { color: colors.secondaryText }]}>{article.content ?? article.summary}</ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.secondaryText }]}>{t.Text.noListings}</ThemedText>
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
    height: 260,
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
