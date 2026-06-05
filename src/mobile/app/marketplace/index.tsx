import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, RefreshControl, Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { MarketplaceServiceToken } from '@/services/marketplaceService';
import type { MarketplaceService } from '@/services/marketplaceService';
import type { BikeListing, MarketplaceFilter, BikeType } from '@/models/marketplace';

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const marketplaceService = useMemo(
    () => container.resolve<MarketplaceService>(MarketplaceServiceToken),
    [],
  );
  const params = useLocalSearchParams();

  const [listings, setListings] = useState<BikeListing[]>([]);
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
      await marketplaceService.toggleFavorite(listingId);
      await Promise.all([loadListingById(listingId), loadListings(page, true)]);
    },
    [marketplaceService, loadListingById, loadListings, page],
  );

  const toggleLike = useCallback(
    async (listingId: string) => {
      if (!listingId) return;
      await marketplaceService.toggleLike(listingId);
      await Promise.all([loadListingById(listingId), loadListings(page, true)]);
    },
    [marketplaceService, loadListingById, loadListings, page],
  );

  useFocusEffect(
    useCallback(() => {
      void loadListings(1, true);
    }, [loadListings]),
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

  function openSell() {
    router.push('/marketplace/create');
  }

  function openFavorites() {
    router.push('/marketplace/favorites');
  }

  function openStolenList() {
    router.push('/marketplace/stolen');
  }

  function renderBikeCard({ item }: { item: BikeListing }) {

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/marketplace/${item.id}`)}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <View style={styles.favoriteWrapper}>
              <TouchableOpacity onPress={() => void toggleFavorite(item.id ?? '')} hitSlop={10}>
                <MaterialIcons
                  name={item.isFavorite ? 'favorite' : 'favorite-border'}
                  size={22}
                  color={item.isFavorite ? '#E85D04' : colors.secondaryText}
                />
              </TouchableOpacity>
              <Text style={[styles.countText, { color: item.isFavorite ? '#E85D04' : colors.secondaryText }]}>{item.favoritesCount ?? 0}</Text>
            </View>
          </View>
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          <View style={styles.cardFooter}>
            <Text style={[styles.cardPrice, { color: colors.accent }]}>Ks {item.price?.toLocaleString()}</Text>
            <Text style={[styles.cardSeller, { color: colors.secondaryText }]}>{item.sellerName}</Text>
          </View>
          <View style={[styles.cardLocationRow, { justifyContent: 'space-between' }]}>
            <View style={styles.locationRowLeft}>
              <MaterialIcons name="location-on" size={14} color={colors.secondaryText} />
              <Text style={[styles.cardLocationText, { color: colors.secondaryText }]}>{item.location}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.viewsWrapper}>
                <MaterialIcons name="visibility" size={16} color={colors.secondaryText} />
                <Text style={[styles.countText, { color: colors.secondaryText }]}>{item.viewCount ?? 0}</Text>
              </View>
              <View style={styles.likeWrapper}> 
                <TouchableOpacity onPress={() => void toggleLike(item.id ?? '')} hitSlop={10}>
                  <MaterialIcons
                    name={item.isLiked ? 'thumb-up' : 'thumb-up-off-alt'}
                    size={22}
                    color={item.isLiked ? '#E85D04' : colors.secondaryText}
                  />
                </TouchableOpacity>
                <Text style={[styles.countText, { color: item.isLiked ? '#E85D04' : colors.secondaryText }]}>{item.likeCount ?? 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t.Title.marketplace}</Text>
          <View style={styles.headerRightRow}>
            <TouchableOpacity style={styles.filterButton} onPress={openFilter} hitSlop={12}>
              <MaterialIcons name="tune" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerButtonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={openSell} hitSlop={12}>
            <MaterialIcons name="sell" size={22} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Sell</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={openFavorites} hitSlop={12}>
            <MaterialIcons name="favorite" size={22} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Favorite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={openStolenList} hitSlop={12}>
            <MaterialIcons name="warning-amber" size={22} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Stolen</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id ?? ""}
        renderItem={renderBikeCard}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />}
        ListEmptyComponent={
          !isLoading ? (
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
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportTopButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  reportTopButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
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
  secondaryButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    gap: 4,
  },
  card: {
    borderRadius: 8,
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
    paddingVertical: 8,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCountText: {
    fontSize: 13,
  },
  likeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
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
