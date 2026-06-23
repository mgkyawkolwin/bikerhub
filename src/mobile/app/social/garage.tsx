import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { MarketplaceServiceToken } from '@/services/marketplaceService';
import type { MarketplaceService } from '@/services/marketplaceService';
import type { BikeListing, MarketplaceFilter } from '@/models/marketplace';
import SnackBar from '@/components/snackbar';

export default function SocialGarageScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
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

  const loadGarage = useCallback(async () => {
    setLoading(true);
    try {
      const response = await marketplaceService.getListings(filter, 1, 50);
      if (!response.ok) {
        SnackBar.Error('Failed to load garage. Please try again later.');
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.Success) {
        SnackBar.Error(responseJson.Message || 'Failed to load garage. Please try again later.');
        return;
      }
      const result = responseJson.Data as { items: BikeListing[]; totalCount: number };
      const items = result.items.filter((item: any) => (userId ? item.sellerId === userId : true));
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
        <Text style={[styles.bikeTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Garage</Text>
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
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No bikes in garage.</Text>
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
