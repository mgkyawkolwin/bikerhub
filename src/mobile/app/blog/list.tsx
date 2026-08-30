import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { BlogServiceToken } from '@/services/blogService';
import type { BlogService } from '@/services/blogService';
import type Blog from '@/models/blog';
import SnackBar from '@/components/snackbar';

export default function BlogListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const blogService = useMemo(() => container.resolve<BlogService>(BlogServiceToken), []);

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadBlogs = useCallback(
    async (pageNumber: number, reset = false) => {
      setLoading(true);
      try {
        const response = await blogService.getBlogs(pageNumber, 10);
        const responseJson = await response.json().catch(() => null);
        const success = responseJson?.success ?? responseJson?.Success;
        const data = responseJson?.data;

        if (!response.ok || !success || !data) {
          const message = responseJson?.message ?? responseJson?.Message ?? 'Failed to load blogs.';
          throw new Error(message);
        }

        const items: Blog[] = Array.isArray(data.items) ? data.items : [];
        setBlogs((prev) => (reset ? items : [...prev, ...items]));
        setPage(data.page ?? pageNumber);
        setTotal(data.total ?? items.length);
      } catch (error) {
        console.error('Failed to load blogs:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Unable to load blogs.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [blogService],
  );

  useFocusEffect(
    useCallback(() => {
      void loadBlogs(1, true);
    }, [loadBlogs]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadBlogs(1, true);
  };

  const handleEndReached = () => {
    if (!loading && blogs.length < total) {
      void loadBlogs(page + 1);
    }
  };

  const renderBlog = ({ item }: { item: Blog }) => {
    const coverImage = item.coverImageUrl ?? item.imageUrl;
    const createdBy = item.createdByName ?? item.author ?? 'Unknown';
    const createdAt = item.createdAtUTC ? new Date(item.createdAtUTC).toLocaleDateString() : '';
    const badgeText = item.postType ? item.postType : 'Blog';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (!item.id) return;
          void router.push(`/blog/${item.id}` as any);
        }}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.imageWrapper}>
          {coverImage ? <Image source={{ uri: coverImage }} style={styles.cardImage} /> : null}
          <View style={[styles.badge, { backgroundColor: colors.accent }]}> 
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          {item.summary ? (
            <Text style={[styles.cardSummary, { color: colors.secondaryText }]} numberOfLines={3}>
              {item.summary}
            </Text>
          ) : item.content ? (
            <Text style={[styles.cardSummary, { color: colors.secondaryText }]} numberOfLines={3}>
              {item.content.slice(0, 180)}{item.content.length > 180 ? '...' : ''}
            </Text>
          ) : null}
        </View>
        <View style={styles.cardFooter}> 
          <View style={styles.footerItem}>
            <MaterialIcons name="person" size={14} color={colors.secondaryText} />
            <Text style={[styles.footerText, { color: colors.secondaryText }]} numberOfLines={1}>{createdBy}</Text>
          </View>
          <View style={styles.footerItem}>
            <MaterialIcons name="schedule" size={14} color={colors.secondaryText} />
            <Text style={[styles.footerText, { color: colors.secondaryText }]}>{createdAt}</Text>
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
        <Text style={[styles.title, { color: colors.text }]}>{t.Title.blogs}</Text>
      </View>
      <FlatList
        data={blogs}
        keyExtractor={(item) => item.id ?? `${item.title}-${item.createdAtUTC}`}
        renderItem={renderBlog}
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
  imageWrapper: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  footerText: {
    fontSize: 12,
    flexShrink: 1,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
