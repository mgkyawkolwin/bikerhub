import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import type ForumPost from '@/models/forumPost';
import initialData from '@/services/mockdata';

export default function ForumIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useThemeContext();

  const allForums = useMemo<ForumPost[]>(() => {
    return (initialData.collections?.forums ?? []) as ForumPost[];
  }, []);

  const pageSize = 4;
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const forums = useMemo(() => allForums.slice(0, page * pageSize), [allForums, page]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setTimeout(() => setRefreshing(false), 250);
  }, []);

  const handleEndReached = useCallback(() => {
    if (loadingMore) return;
    if (forums.length < allForums.length) {
      setLoadingMore(true);
      setTimeout(() => {
        setPage((prev) => prev + 1);
        setLoadingMore(false);
      }, 250);
    }
  }, [allForums.length, forums.length, loadingMore]);

  const renderItem = ({ item }: { item: ForumPost }) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/forum/[id]', params: { id: item.id } })}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          <View style={styles.metaChip}>
            <Text style={[styles.metaChipText, { color: colors.text }]}>{item.category}</Text>
          </View>
        </View>
        <Text style={[styles.excerpt, { color: colors.secondaryText }]}>{item.excerpt}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <MaterialIcons name="person" size={14} color={colors.secondaryText} />
            <Text style={[styles.statsText, { color: colors.secondaryText }]}>{item.author}</Text>
          </View>
          <View style={styles.statsItem}>
            <MaterialIcons name="chat-bubble-outline" size={14} color={colors.secondaryText} />
            <Text style={[styles.statsText, { color: colors.secondaryText }]}>{item.replies.length} replies</Text>
          </View>
          <View style={styles.statsItem}>
            <MaterialIcons name="visibility" size={14} color={colors.secondaryText} />
            <Text style={[styles.statsText, { color: colors.secondaryText }]}>{item.views}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t.Title.forums}</Text>
      </View>

      <FlatList
        data={forums}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.text} /> : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 20, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, gap: 14, paddingTop: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  footerLoader: { paddingVertical: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  metaChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#E0E0E0' },
  metaChipText: { fontSize: 12, fontWeight: '700' },
  excerpt: { fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statsItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statsText: { fontSize: 12 },
});
