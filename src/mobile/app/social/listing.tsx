import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { MarketplaceServiceToken } from '@/services/marketplaceService';
import type { MarketplaceService } from '@/services/marketplaceService';
import type { BikeListing, MarketplaceFilter } from '@/models/marketplace';

export default function SocialListingScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const params = useLocalSearchParams();
  const marketplaceService = useMemo(
    () => container.resolve<MarketplaceService>(MarketplaceServiceToken),
    [],
  );
  const [listings, setListings] = useState<BikeListing[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const filter = useMemo<MarketplaceFilter>(() => ({
    make: '',
    model: '',
    modelYear: '',
    priceMin: undefined,
    priceMax: undefined,
    cc: '',
    type: undefined,
    location: '',
  }), []);

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
    async () => {
      if (!userId) {
        setListings([]);
        return;
      }

      setLoading(true);
      try {
        const result = await marketplaceService.getListings(filter, 1, 50);
        setListings(result.items.filter((item) => item.sellerId === userId));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, marketplaceService, userId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadListings();
    }, [loadListings]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadListings();
  };

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (!listingId) return;
      await marketplaceService.toggleFavorite(listingId);
      void loadListings();
    },
    [loadListings, marketplaceService],
  );

  const toggleLike = useCallback(
    async (listingId: string) => {
      if (!listingId) return;
      await marketplaceService.toggleLike(listingId);
      void loadListings();
    },
    [loadListings, marketplaceService],
  );

  const renderBikeCard = ({ item }: { item: BikeListing }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/marketplace/${item.id}`)}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.cardHeader}>
          <ThemedText style={[styles.cardTitle, { color: colors.primary }]}>{item.title}</ThemedText>
          <View style={styles.favoriteWrapper}>
            <TouchableOpacity onPress={() => void toggleFavorite(item.id ?? '')} hitSlop={10}>
              <MaterialIcons
                name={item.isFavorite ? 'favorite' : 'favorite-border'}
                size={22}
                color={item.isFavorite ? '#E85D04' : colors.secondary}
              />
            </TouchableOpacity>
            <ThemedText style={[styles.countText, { color: item.isFavorite ? '#E85D04' : colors.secondary }]}>
              {item.favoritesCount ?? 0}
            </ThemedText>
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
          <View style={styles.statsRow}>
            <View style={styles.viewsWrapper}>
              <MaterialIcons name="visibility" size={16} color={colors.secondary} />
              <ThemedText style={[styles.countText, { color: colors.secondary }]}>{item.viewCount ?? 0}</ThemedText>
            </View>
            <View style={styles.likeWrapper}> 
              <TouchableOpacity onPress={() => void toggleLike(item.id ?? '')} hitSlop={10}>
                <MaterialIcons
                  name={item.isLiked ? 'thumb-up' : 'thumb-up-off-alt'}
                  size={22}
                  color={item.isLiked ? '#E85D04' : colors.secondary}
                />
              </TouchableOpacity>
              <ThemedText style={[styles.countText, { color: item.isLiked ? '#E85D04' : colors.secondary }]}>{item.likeCount ?? 0}</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!userId) {
    return (
      <View style={[styles.root, { backgroundColor: colors.root, paddingTop: insets.top }]}> 
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
              <MaterialIcons name="arrow-back" size={22} color={colors.headerText} />
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: colors.headerText }]}>Listings</ThemedText>
            <View style={styles.headerRightRow} />
          </View>
        </View>
        <View style={styles.emptyState}>
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>No user selected.</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.root, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.headerText} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: colors.headerText }]}>Listings</ThemedText>
          <View style={styles.headerRightRow} />
        </View>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderBikeCard}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>No listings found for this user.</ThemedText>
          </View>
        ) : null}
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
  headerButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
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
  likeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontSize: 13,
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
