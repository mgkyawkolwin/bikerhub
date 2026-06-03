import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { NewsServiceToken } from '@/services/newsService';
import type { NewsService } from '@/services/newsService';
import News from '@/models/news';

export default function NewsArticlesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const newsService = useMemo(() => container.resolve<NewsService>(NewsServiceToken), []);

  const [articles, setArticles] = useState<News[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadArticles = useCallback(
    async (pageNumber: number, reset = false) => {
      setLoading(true);
      try {
        const result = await newsService.getNews(pageNumber, 10);
        setArticles((prev) => (reset ? result.items : [...prev, ...result.items]));
        setPage(result.page);
        setTotal(result.total);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [newsService],
  );

  useEffect(() => {
    void loadArticles(1, true);
  }, [loadArticles]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadArticles(1, true);
  };

  const handleEndReached = () => {
    if (!loading && articles.length < total) {
      void loadArticles(page + 1);
    }
  };

  const renderArticle = ({ item }: { item: News }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => item.id && void router.push({ pathname: '/articles/[id]', params: { id: item.id } })}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : null}
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.headline}</Text>
            <Text style={[styles.cardSummary, { color: colors.secondaryText }]} numberOfLines={3}>
              {item.summary}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={14} color={colors.secondaryText} />
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>{new Date(item.dateTimeUTC ?? '').toLocaleDateString()}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="source" size={14} color={colors.secondaryText} />
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.source}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t.Title.articles}</Text>
      </View>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderArticle}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>{t.Text.noListings}</Text>
            </View>
          ) : null
        }
      />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
