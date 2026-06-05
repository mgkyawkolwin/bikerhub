import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, TouchableOpacity, Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import type { BikeListing } from '@/models/bikeListing';
import { MarketplaceServiceToken } from '@/services/marketplaceService';
import type { MarketplaceService } from '@/services/marketplaceService';

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
        const result = await marketplaceService.getFavorites();
        setFavorites(result);
      } finally {
        setRefreshing(false);
      }
    },
    [marketplaceService],
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

  const renderBikeCard = ({ item }: { item: BikeListing }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/marketplace/${item.id}`)}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          <TouchableOpacity onPress={() => void toggleFavorite(item.id ?? '')} hitSlop={10}>
            <MaterialIcons name="favorite" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        <View style={styles.cardFooter}>
          <Text style={[styles.cardPrice, { color: colors.accent }]}>Ks {item.price?.toLocaleString()}</Text>
          <Text style={[styles.cardSeller, { color: colors.secondaryText }]}>{item.sellerName}</Text>
        </View>
        <View style={styles.cardLocationRow}>
          <MaterialIcons name="location-on" size={14} color={colors.secondaryText} />
          <Text style={[styles.cardLocationText, { color: colors.secondaryText }]}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
});
