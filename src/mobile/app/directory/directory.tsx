import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import SearchInput from '@/components/searchInput';
import { container } from '@/services';
import { DirectoryServiceToken, type DirectoryFilter, type DirectoryService } from '@/services/directoryService';
import Directory from '@/models/directory';
import SnackBar from '@/components/snackbar';

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
  const { colors } = useThemeContext();
  const directoryService = useMemo(() => container.resolve<DirectoryService>(DirectoryServiceToken), []);
  const params = useLocalSearchParams();
  const paramBusinessType = getParamValue(params.businessType);

  const [items, setItems] = useState<Directory[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);


  const routeFilters = useMemo<DirectoryFilter>(() => ({
    businessType: paramBusinessType || undefined,
  }), [paramBusinessType]);

  const loadItems = useCallback(
    async (pageNumber: number, reset = false, query = '', filters?: DirectoryFilter) => {
      setLoading(true);
      try {
        const response = await directoryService.getDirectories(pageNumber, 10, query, filters);
        if (!response.ok) {
          SnackBar.Error('Error loading data. Invalid response from server.');
          return;
        }
        const responseJson = await response.json();
        if (responseJson?.success !== true) {
          SnackBar.Error(responseJson?.message || 'Error loading data. Failed response.');
          return;
        }
        setItems((prev) => (reset ? responseJson.data.items : [...prev, ...responseJson.data.items]));
        setPage(responseJson.data.page);
        setTotal(responseJson.data.total);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [directoryService, t],
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
    if (!loading && items?.length < total) {
      void loadItems(page + 1, false, searchQuery || '', routeFilters);
    }
  };

  const renderItem = ({ item }: { item: Directory }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => item.id && void router.push({ pathname: '/directory/[id]', params: { id: item.id } })}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.cardRow}>
          <View style={[styles.cardImageContainer, { backgroundColor: colors.card }]}> 
            {item.coverImageUrl ? (
              <Image source={{ uri: item.coverImageUrl }} style={styles.cardImage} />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: colors.background }]}> 
                <MaterialIcons name="image" size={28} color={colors.secondaryText} />
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.cardSummary, { color: colors.secondaryText }]} numberOfLines={1}>
              {item.businessType} · {item.state} · {item.city} · {item.country}
            </Text>
            <Text style={[styles.cardDetail, { color: colors.secondaryText }]} numberOfLines={1}>
              {item.address}{item.address && item.city ? ' · ' : ''}{item.city}{(item.city || item.address) && item.postalCode ? ' · ' : ''}{item.postalCode}
            </Text>
            <View style={styles.contactRow}>
              {item.phone ? (
                <View style={styles.contactItem}>
                  <MaterialIcons name="phone" size={14} color={colors.secondaryText} />
                  <Text style={[styles.cardDetail, { color: colors.secondaryText }]} numberOfLines={1}>{item.phone}</Text>
                </View>
              ) : null}
              {item.email ? (
                <View style={[styles.contactItem, item.phone ? styles.contactItemSpacing : undefined]}>
                  <MaterialIcons name="email" size={14} color={colors.secondaryText} />
                  <Text style={[styles.cardDetail, { color: colors.secondaryText }]} numberOfLines={1}>{item.email}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.metaRow}>
                <MaterialIcons name="favorite" size={14} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.likesCount ?? 0}</Text>
              </View>
              <View style={styles.metaRow}>
                <MaterialIcons name="star" size={14} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.rating ?? 0} ({item.ratingCount ?? 0})</Text>
              </View>
            </View>
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
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t.Title.directory} </Text>
        </View>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity onPress={() => router.push('/directory/new')} style={styles.iconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
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
            <MaterialIcons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/directory/directorySearch')} style={styles.filterButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="filter-list" size={24} color={colors.text} />
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
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden', padding: 8 },
  searchInput: { width: 160 },
  filterButton: { padding: 6 },
  cardRow: { flexDirection: 'row', alignItems: 'stretch' },
  cardImageContainer: { width: 100, minHeight: 100, justifyContent: 'center', alignItems: 'center' },
  cardImage: { width: 100, height: 100 },
  placeholderImage: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, padding: 16, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSummary: { fontSize: 13, lineHeight: 18 },
  cardDetail: { fontSize: 12, lineHeight: 18 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 2 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  contactItemSpacing: { marginLeft: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
