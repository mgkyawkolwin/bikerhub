import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import MarketplaceCardItem from './carditem';
import type { BikeListing } from '@/models/bikeListing';
import { MarketplaceServiceToken } from '@/services/marketplaceService';
import type { MarketplaceService } from '@/services/marketplaceService';
import SnackBar from '@/components/snackbar';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { colors } = useThemeContext();

  const [favorites, setFavorites] = useState<BikeListing[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const marketplaceService = container.resolve<MarketplaceService>(MarketplaceServiceToken);

  const loadListings = useCallback(
    async () => {
      try {
        const response = await marketplaceService.getFavorites();
        if (!response.ok) {
          // Handle error response
          SnackBar.Error('Request failed. Please try again.');
          return;
        }
        const responseJson = await response.json();
        console.log('Load Favorites Response:', responseJson);
        if (!responseJson.success) {
          SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
          return;
        }
        const responseData = responseJson.data as BikeListing[];
        setFavorites(responseData);
      } finally {
        setRefreshing(false);
      }
    },
    [marketplaceService],
  );

  const loadListingById = useCallback(
    async (listingId: string) => {
      if (!listingId) return;
      const response = await marketplaceService.getListingById(listingId);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again later.');
        return;
      }
      const responseJson = await response.json();
      console.log('Load Listing By ID Response:', responseJson);
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again later.');
        return;
      }
      const updated = responseJson.data as BikeListing;
      if (updated) {
        setFavorites((prev) => prev.map((item) => (item.id === listingId ? updated : item)));
      }
    },
    [marketplaceService],
  );


  const toggleLike = useCallback(
    async (listingId: string) => {
      if (!listingId) return;
      await marketplaceService.toggleLike(listingId);
      await Promise.all([loadListingById(listingId), loadListings()]);
    },
    [marketplaceService, loadListingById, loadListings],
  );


  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (!listingId) return;
      await marketplaceService.toggleFavorite(listingId);
      await loadListings();
    },
    [marketplaceService, loadListings],
  );

  useFocusEffect(
    useCallback(() => {
      void loadListings();
    }, [loadListings]),
  );

  function handleRefresh() {
    setRefreshing(true);
    void loadListings();
  }

  const renderBikeCard = ({ item }: { item: BikeListing }) => {
    return (
      <MarketplaceCardItem
        item={item}
        onPress={() => router.push(`/marketplace/${item.id}`)}
        onToggleFavorite={toggleFavorite}
        onToggleLike={toggleLike}
      />
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>{t.Title.favorite}</Text>
        <View style={styles.filterButton} />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderBikeCard}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>{t.Text.noFavorites || 'No favorites yet.'}</Text>
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
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  filterButton: {
    width: 42,
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
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
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
  favoriteWrapper: {
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
});
