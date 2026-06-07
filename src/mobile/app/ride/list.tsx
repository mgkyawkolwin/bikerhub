import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, Alert, Text, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container } from '@/services';
import { RideServiceToken } from '@/services/rideService';
import { setRouteDraft } from '@/services/routeTransfer';
import type { RideService } from '@/services/rideService';
import Ride from '@/models/ride';

export default function RideListScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const { getAuthUser } = useAuthContext();
  const authUser = getAuthUser();
  const viewedUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const rideService = useMemo(() => container.resolve<RideService>(RideServiceToken), []);

  const [rides, setRides] = useState<Ride[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadRides = useCallback(
    async (pageNumber: number, reset = false) => {
      setLoading(true);
      try {
        const response = await rideService.getRides(pageNumber, 10);
        const responseJson = await response.json().catch(() => null);
        const success = responseJson?.success ?? responseJson?.Success;
        const data = responseJson?.data;

        if (!response.ok || !success || !data) {
          const message = responseJson?.message ?? responseJson?.Message ?? 'Failed to load rides.';
          throw new Error(message);
        }

        const items: Ride[] = Array.isArray(data.items) ? data.items : [];
        const filteredItems = viewedUserId
          ? items.filter((ride) => ride.createdById === viewedUserId)
          : items;

        setRides((prev) => (reset ? filteredItems : [...prev, ...filteredItems]));
        setPage(data.page ?? pageNumber);
        setTotal(data.total ?? filteredItems.length);
        setTotalPages(data.totalPages ?? 1);
      } catch (error) {
        console.error('Failed to load rides:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Unable to load rides.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rideService, viewedUserId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadRides(1, true);
    }, [loadRides]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadRides(1, true);
  };

  const handleEndReached = () => {
    if (!loading && page < totalPages) {
      void loadRides(page + 1);
    }
  };

  const currentUserId = authUser?.id;
  const isOwnRides = !viewedUserId || viewedUserId === currentUserId;

  const renderRide = ({ item }: { item: Ride }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => loadRide(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="schedule" size={14} color={colors.secondaryText} />
          <Text style={[styles.metaText, { color: colors.secondaryText }]}>{t.Title.duration}: {item.duration ?? 0}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="straighten" size={14} color={colors.secondaryText} />
          <Text style={[styles.metaText, { color: colors.secondaryText }]}>{t.Title.distance}: {item.distance ?? 0}</Text>
        </View>
        {item.createdById ? (
          <View style={styles.metaRow}>
            <MaterialIcons name="person" size={14} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>{t.Title.createdBy}: {item.createdById}</Text>
          </View>
        ) : null}
        <Text style={[styles.cardSummary, { color: colors.secondaryText }]} numberOfLines={3}>{item.description}</Text>
      </View>
      <TouchableOpacity
        onPress={() => loadRide(item)}
        style={[styles.downloadButton, { borderColor: colors.accent, backgroundColor: colors.accent }]}
        activeOpacity={0.8}
      >
        <Text style={styles.downloadText}>View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const loadRide = (item: Ride) => {
    const draft = {
      locations: item.locations ?? [],
      routePath: item.locations ?? [],
      totalDistance: item.distance ?? 0,
      totalDuration: item.duration ?? 0,
    } as any;

    setRouteDraft(draft);

    if (item.id) {
      router.push({ pathname: '/ride/rides', params: { rideId: item.id } });
    } else {
      router.push('/ride/rides');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { backgroundColor: colors.background }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Rides</Text>
        <View style={styles.actionsRow}>
          {isOwnRides ? (
            <TouchableOpacity style={[styles.iconAction, { backgroundColor: colors.accent }]} activeOpacity={0.8} onPress={() => router.push('/ride/rides')}>
              <MaterialIcons name="directions-bike" size={18} color="#FFFFFF" />
              <Text style={styles.recordActionText}>Ride</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id ?? Math.random().toString()}
        renderItem={renderRide}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>{t.Text.noRoutes}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 8 },
  title: { fontSize: 22, fontWeight: '700', flex: 1, textAlign: 'center', color: '#FFFFFF' },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  iconAction: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, marginLeft: 10, borderRadius: 14 },
  recordActionText: { marginLeft: 6, fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  headerAction: { paddingHorizontal: 10, paddingVertical: 8 },
  headerButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  cardBody: { padding: 16, gap: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  badge: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  deleteButton: { padding: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13 },
  cardSummary: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  downloadButton: { margin: 16, borderRadius: 8, paddingVertical: 8, alignContent: 'center', alignItems: 'center', justifyContent: 'center' },
  uploadRouteButton: { maxWidth: 50, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E85D04', backgroundColor: 'transparent' },
  uploadRouteText: { fontSize: 15, fontWeight: '700' },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, color: '#666666' },
  textInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15 },
  splitRow: { flexDirection: 'row', gap: 12 },
  splitItem: { flex: 1 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14 },
  uploadText: { fontSize: 15, fontWeight: '600' },
  fileName: { marginTop: 8, fontSize: 13 },
  submitButton: { marginTop: 12, borderRadius: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  downloadText: { alignSelf: 'center', fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
