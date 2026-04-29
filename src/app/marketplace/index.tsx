import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import { container } from '@/services';
import { FavoriteServiceToken } from '@/services/favoriteService';
import { LikeServiceToken } from '@/services/likeService';
import { MarketplaceServiceToken } from '@/services/marketplaceService';
import type { FavoriteService } from '@/services/favoriteService';
import type { LikeService } from '@/services/likeService';
import type { MarketplaceService } from '@/services/marketplaceService';
import type { BikeListing, MarketplaceFilter, BikeType } from '@/models/marketplace';

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const marketplaceService = useMemo(
    () => container.resolve<MarketplaceService>(MarketplaceServiceToken),
    [],
  );
  const favoriteService = useMemo(
    () => container.resolve<FavoriteService>(FavoriteServiceToken),
    [],
  );
  const likeService = useMemo(
    () => container.resolve<LikeService>(LikeServiceToken),
    [],
  );
  const params = useLocalSearchParams();

  const [listings, setListings] = useState<BikeListing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filter: MarketplaceFilter = useMemo(
    () => ({
      make: Array.isArray(params.make) ? params.make[0] : params.make ?? '',
      model: Array.isArray(params.model) ? params.model[0] : params.model ?? '',
      modelYear: Array.isArray(params.modelYear) ? params.modelYear[0] : params.modelYear ?? '',
      priceMin: params.priceMin ? Number(Array.isArray(params.priceMin) ? params.priceMin[0] : params.priceMin) : undefined,
      priceMax: params.priceMax ? Number(Array.isArray(params.priceMax) ? params.priceMax[0] : params.priceMax) : undefined,
      cc: Array.isArray(params.cc) ? params.cc[0] : params.cc ?? '',
      type: (Array.isArray(params.type) ? params.type[0] : params.type) as BikeType | undefined,
      location: Array.isArray(params.location) ? params.location[0] : params.location ?? '',
    }),
    [
      params.make,
      params.model,
      params.modelYear,
      params.priceMin,
      params.priceMax,
      params.cc,
      params.type,
      params.location,
    ],
  );

  const colors = useMemo(
    () => ({
      root: '#000000',
      card: isDark ? '#121212' : '#FFFFFF',
      border: isDark ? '#232323' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      headerText: '#FFFFFF',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const loadListings = useCallback(
    async (pageNumber: number, reset = false) => {
      setIsLoading(true);

      try {
        const result = await marketplaceService.getListings(filter, pageNumber, 10);
        setListings((prev) => (reset ? result.items : [...prev, ...result.items]));
        setPage(result.page);
        setTotal(result.total);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [filter, marketplaceService],
  );

  const loadFavorites = useCallback(async () => {
    const favorites = await favoriteService.getFavorites();
    setFavoriteIds(new Set(favorites.map((item) => item.id).filter(Boolean) as string[]));
  }, [favoriteService]);

  const loadLikes = useCallback(async () => {
    const likes = await likeService.getLikedIds();
    setLikedIds(new Set(likes));
  }, [likeService]);

  const loadListingById = useCallback(
    async (listingId: string) => {
      if (!listingId) return;
      const updated = await marketplaceService.getListingById(listingId);
      if (updated) {
        setListings((prev) => prev.map((item) => (item.id === listingId ? updated : item)));
      }
    },
    [marketplaceService],
  );

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (!listingId) return;
      await favoriteService.toggleFavorite(listingId);
      await Promise.all([loadFavorites(), loadListingById(listingId), loadListings(page, true)]);
    },
    [favoriteService, loadFavorites, loadListingById, loadListings, page],
  );

  const toggleLike = useCallback(
    async (listingId: string) => {
      if (!listingId) return;
      await likeService.toggleLike(listingId);
      await Promise.all([loadLikes(), loadListingById(listingId), loadListings(page, true)]);
    },
    [likeService, loadLikes, loadListingById, loadListings, page],
  );

  useFocusEffect(
    useCallback(() => {
      void loadListings(1, true);
      void loadFavorites();
      void loadLikes();
    }, [loadListings, loadFavorites, loadLikes]),
  );

  function handleRefresh() {
    setRefreshing(true);
    void loadListings(1, true);
  }

  function handleEndReached() {
    if (!isLoading && listings.length < total) {
      void loadListings(page + 1);
    }
  }

  function openFilter() {
    router.push({
      pathname: '/marketplace/filter',
      params: {
        make: filter.make,
        model: filter.model,
        modelYear: filter.modelYear,
        priceMin: filter.priceMin?.toString(),
        priceMax: filter.priceMax?.toString(),
        cc: filter.cc,
        type: filter.type,
        location: filter.location,
      },
    });
  }

  function renderBikeCard({ item }: { item: BikeListing }) {
    const isFavorite = item.id ? favoriteIds.has(item.id) : false;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/marketplace/${item.id}`)}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.cardTitle, { color: colors.primary }]}>{item.title}</ThemedText>
            <View style={styles.favoriteWrapper}>
              <View style={[styles.favoriteCountBadge, { borderColor: colors.border, backgroundColor: isFavorite ? '#E85D04' : colors.card }]}> 
                <ThemedText style={[styles.favoriteCountText, { color: isFavorite ? '#FFFFFF' : colors.secondary }]}>{item.favoritesCount ?? 0}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => void toggleFavorite(item.id ?? '')} hitSlop={10}>
                <MaterialIcons
                  name={isFavorite ? 'favorite' : 'favorite-border'}
                  size={22}
                  color={isFavorite ? '#E85D04' : colors.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          <View style={styles.cardFooter}>
            <ThemedText style={[styles.cardPrice, { color: colors.accent }]}>Ks {item.price?.toLocaleString()}</ThemedText>
            <ThemedText style={[styles.cardSeller, { color: colors.secondary }]}>{item.sellerName}</ThemedText>
          </View>
          <View style={[styles.cardLocationRow, { justifyContent: 'space-between' }]}>
            <View style={styles.locationRowLeft}>
              <MaterialIcons name="location-on" size={14} color={colors.secondary} />
              <ThemedText style={[styles.cardLocationText, { color: colors.secondary }]}>{item.location}</ThemedText>
            </View>
            <View style={styles.likeWrapper}> 
              <View style={[styles.likeCountBadge, { borderColor: colors.border, backgroundColor: likedIds.has(item.id ?? '') ? '#E85D04' : colors.card }]}> 
                <ThemedText style={[styles.likeCountText, { color: likedIds.has(item.id ?? '') ? '#FFFFFF' : colors.secondary }]}>{item.likeCount ?? 0}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => void toggleLike(item.id ?? '')} hitSlop={10}>
                <MaterialIcons
                  name={likedIds.has(item.id ?? '') ? 'thumb-up' : 'thumb-up-off-alt'}
                  size={22}
                  color={likedIds.has(item.id ?? '') ? '#E85D04' : colors.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.root, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.headerText} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, { color: colors.headerText }]}>{t.Title.marketplace}</ThemedText>
        <TouchableOpacity style={styles.filterButton} onPress={openFilter} hitSlop={12}>
          <MaterialIcons name="tune" size={22} color={colors.headerText} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id ?? ""}
        renderItem={renderBikeCard}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !isLoading ? (
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
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    gap: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
  },
  favoriteWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteCountBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  favoriteCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  locationRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likeCountBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  likeCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardSeller: {
    fontSize: 13,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  cardLocationText: {
    fontSize: 13,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
