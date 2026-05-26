import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/mobile/i18n';
import { useThemeContext } from '@/mobile/hooks/use-theme-context';
import { ThemedText } from '@/mobile/components/themedText';
import SearchInput from '@/mobile/components/searchInput';
import { container } from '@/services';
import { DirectoryServiceToken, type DirectoryFilter, type DirectoryService } from '@/services/directoryService';
import Directory from '@/models/directory';

const getParamValue = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

export default function DirectoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const directoryService = useMemo(() => container.resolve<DirectoryService>(DirectoryServiceToken), []);
  const params = useLocalSearchParams();
  const paramBusinessType = getParamValue(params.businessType);
  const paramCity = getParamValue(params.city);
  const paramStateDivision = getParamValue(params.stateDivision);

  const [items, setItems] = useState<Directory[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

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

  const routeFilters = useMemo<DirectoryFilter>(() => ({
    businessType: paramBusinessType || undefined,
    city: paramCity || undefined,
    stateDivision: paramStateDivision || undefined,
  }), [paramBusinessType, paramCity, paramStateDivision]);

  const loadItems = useCallback(
    async (pageNumber: number, reset = false, query = '', filters?: DirectoryFilter) => {
      setLoading(true);
      try {
        const result = await directoryService.getDirectories(pageNumber, 10, query, filters);
        setItems((prev) => (reset ? result.items : [...prev, ...result.items]));
        setPage(result.page);
        setTotal(result.total);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [directoryService],
  );

  useEffect(() => {
    void loadItems(1, true, '', routeFilters);
  }, [loadItems, routeFilters]);

  useEffect(() => {
    if (!searchQuery) {
      void loadItems(1, true, '', routeFilters);
      return;
    }

    const timer = setTimeout(() => {
      void loadItems(1, true, searchQuery, routeFilters);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchQuery, loadItems, routeFilters]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadItems(1, true, searchQuery || '', routeFilters);
  };

  const handleEndReached = () => {
    if (!loading && items.length < total) {
      void loadItems(page + 1, false, searchQuery || '', routeFilters);
    }
  };

  const renderItem = ({ item }: { item: Directory }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => item.id && void router.push({ pathname: '/directory/[id]', params: { id: item.id } })}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        {item.coverImageUrl ? <Image source={{ uri: item.coverImageUrl }} style={styles.cardImage} /> : null}
        <View style={styles.cardBody}>
          <ThemedText style={[styles.cardTitle, { color: colors.primary }]}>{item.name}</ThemedText>
          <ThemedText style={[styles.cardSummary, { color: colors.secondary }]} numberOfLines={2}>
            {item.businessType} · {item.city}
          </ThemedText>
          <ThemedText style={[styles.cardAddress, { color: colors.secondary }]} numberOfLines={2}>
            {item.address}
          </ThemedText>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <MaterialIcons name="favorite" size={14} color={colors.secondary} />
            <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{item.likesCount ?? 0}</ThemedText>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="star" size={14} color={colors.secondary} />
            <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{item.rating ?? 0} ({item.ratingCount ?? 0})</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: colors.primary }]}>{t.Title.directory}</ThemedText>
        </View>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            onPress={() => {
              if (showSearchBar) {
                setSearchQuery('');
                setShowSearchBar(false);
              } else {
                setShowSearchBar(true);
              }
            }}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="search" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/directory/directorySearch')} style={styles.filterButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="filter-list" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      {showSearchBar ? (
        <View style={[styles.searchBarRow, { borderBottomColor: colors.border, backgroundColor: colors.card }]}> 
          <SearchInput
            style={styles.searchInputExpanded}
            value={searchQuery}
            onChangeText={(value) => {
              setSearchQuery(value);
              if (!value.trim()) {
                setShowSearchBar(false);
              }
            }}
            onClear={() => {
              setSearchQuery('');
              setShowSearchBar(false);
            }}
            placeholder="Search directory"
          />
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>{t.Text.noListings}</ThemedText>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  searchPane: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRightIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { padding: 8 },
  searchBarRow: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  searchInputExpanded: { width: '100%' },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  searchInput: { width: 160 },
  filterButton: { padding: 6 },
  cardImage: { width: '100%', height: 180 },
  cardBody: { padding: 16, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardSummary: { fontSize: 14, lineHeight: 10 },
  cardAddress: { fontSize: 13, lineHeight: 10 },
  cardFooter: { paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
