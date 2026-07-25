import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container } from '@/services';
import { GarageBikeServiceToken } from '@/services/garageBikeService';
import type { GarageBikeService } from '@/services/garageBikeService';
import type { GarageBike } from '@/models/garageBike';
import SnackBar from '@/components/snackbar';

export default function SocialGarageScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const { authUser } = useAuthContext();
  const params = useLocalSearchParams();
  const garageBikeService = useMemo(
    () => container.resolve<GarageBikeService>(GarageBikeServiceToken),
    [],
  );
  const [garageBikes, setGarageBikes] = useState<GarageBike[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const currentUserId = authUser?.id;
  const isOwnGarage = Boolean(!userId || (currentUserId && userId === currentUserId));

  const loadGarageBikes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await garageBikeService.getGarageBikes(userId);
      if (!response.ok) {
        SnackBar.Error(`${response.status}: ${response.statusText}. Request failed. Please try again.`);
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Unknown error occurred. Please try again later.');
        return;
      }

      const items = Array.isArray(responseJson.Data) ? responseJson.Data : [];
      setGarageBikes(items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [garageBikeService, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadGarageBikes();
    }, [loadGarageBikes]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadGarageBikes();
  };

  const renderGarageBike = ({ item }: { item: GarageBike }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.bikeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {}}
    >
      <Image
        source={{ uri: item.images?.[0] || 'https://placehold.co/600x400/png?text=No+Image' }}
        style={styles.bikeImage}
      />
      <View style={styles.bikeInfo}>
        <Text style={[styles.bikeTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.bikeMeta, { color: colors.secondaryText }]} numberOfLines={1}>
          {item.make} {item.model}
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
          {isOwnGarage ? (
            <TouchableOpacity
              style={[styles.addButton, { borderColor: colors.accent }]}
              activeOpacity={0.8}
              onPress={() => router.push('/social/addGarageBike' as never)}
            >
              <MaterialIcons name="add" size={16} color={colors.accent} />
              <Text style={[styles.addButtonText, { color: colors.accent }]}>Add Bike</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </View>

      <FlatList
        data={garageBikes}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderGarageBike}
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
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  addButtonText: {
    fontSize: 13,
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
  bikeMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
