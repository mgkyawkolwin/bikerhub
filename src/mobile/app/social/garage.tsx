import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/mobile/components/themedText';
import { useThemeContext } from '@/mobile/hooks/use-theme-context';
import { container } from '@/services';
import { MarketplaceServiceToken } from '@/services/marketplaceService';
import type { MarketplaceService } from '@/services/marketplaceService';
import type { BikeListing, MarketplaceFilter } from '@/models/marketplace';

export default function SocialGarageScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const params = useLocalSearchParams();
  const marketplaceService = useMemo(
    () => container.resolve<MarketplaceService>(MarketplaceServiceToken),
    [],
  );
  const [bikes, setBikes] = useState<BikeListing[]>([]);
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
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const loadGarage = useCallback(async () => {
    setLoading(true);
    try {
      const result = await marketplaceService.getListings(filter, 1, 50);
      const items = result.items.filter((item) => (userId ? item.sellerId === userId : true));
      setBikes(items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, marketplaceService, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadGarage();
    }, [loadGarage]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadGarage();
  };

  const renderBike = ({ item }: { item: BikeListing }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.bikeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/marketplace/${item.id}`)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.bikeImage} />
      <View style={styles.bikeInfo}>
        <ThemedText style={[styles.bikeTitle, { color: colors.primary }]} numberOfLines={1}>
          {item.title}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.root, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: colors.primary }]}>Garage</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <FlatList
        data={bikes}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderBike}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>No bikes in garage.</ThemedText>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  bikeCard: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bikeImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E0E0E0',
  },
  bikeInfo: {
    padding: 12,
  },
  bikeTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
