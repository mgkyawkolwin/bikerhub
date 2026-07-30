import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, Alert, Text, RefreshControl, Image } from 'react-native';
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
import polyline from '@mapbox/polyline';

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '0 min';

  const totalMinutes = Math.max(1, Math.ceil(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins}m`;
};

const formatDistance = (distance?: number) => {
  if (!distance || distance <= 0) return '0 km';
  if (distance < 1) return `${Math.round(distance * 1000)} m`;
  return `${distance.toFixed(2)} km`;
};

const formatAvgSpeed = (speed?: number) => {
  if (!speed || speed <= 0) return '0 km/h';
  return `${speed.toFixed(1)} km/h`;
};

const getStaticMapUrl = (locations: Ride['locations'], apiKey?: string) => {
  const safeLocations = (locations ?? []).filter((point) => point?.latitude != null && point?.longitude != null);
  if (safeLocations.length < 2 || !apiKey) return null;

  const encodedPath = polyline.encode(safeLocations.map(p => [p.latitude, p.longitude])); // encodePolyline(safeLocations);
  const start = safeLocations[0];
  const end = safeLocations[safeLocations.length - 1];

  const params = [
    'size=600x400',
    'scale=2',
    'maptype=roadmap',
    `path=color:0x2196F3|weight:5|enc:${encodedPath}`,
    `markers=color:green|label:S|${start.latitude},${start.longitude}`,
    `markers=color:red|label:E|${end.latitude},${end.longitude}`,
  ];

  return `https://maps.googleapis.com/maps/api/staticmap?${params.join('&')}&key=${encodeURIComponent(apiKey)}`;
};

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
  const googleMapsApiKey = 'AIzaSyDhdk-puMVacWKP-sxoM205gR5Yl4LX4Wk';

  const renderRide = ({ item }: { item: Ride }) => {
    const staticMapUrl = getStaticMapUrl(item.locations, googleMapsApiKey);
    const hasRoutePreview = Boolean(staticMapUrl);

    return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => loadRide(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
        </View>
        {hasRoutePreview ? (
          <Image source={{ uri: staticMapUrl! }} style={styles.mapPreview} resizeMode="cover" />
        ) : (
          <View style={styles.mapPreviewPlaceholder}>
            <MaterialIcons name="map" size={24} color={colors.secondaryText} />
            <Text style={[styles.mapPreviewPlaceholderText, { color: colors.secondaryText }]}>Route preview unavailable</Text>
          </View>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialIcons name="straighten" size={28} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{formatDistance(item.distance)}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={28} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{formatDuration(item.duration)}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="speed" size={28} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{formatAvgSpeed(item.averageSpeed)}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Avg. Speed</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="terrain" size={28} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{item.elevation ?? 0} ft</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Elevation</Text>
          </View>
        </View>
        {item.description ? (
          <Text style={[styles.cardSummary, { color: colors.secondaryText }]} numberOfLines={3}>
            {item.description.slice(0, 300)}{item.description.length > 300 ? '...' : ''}
          </Text>
        ) : null}
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
  };

  const loadRide = (item: Ride) => {
    const draft = {
      locations: item.locations ?? [],
      routePath: item.locations ?? [],
      totalDistance: item.distance ?? 0,
      totalDuration: item.duration ?? 0,
    } as any;

    setRouteDraft(draft);

    if (item.id) {
      router.push({ pathname: '/ride/rideRecorder', params: { rideId: item.id } });
    } else {
      router.push('/ride/rideRecorder');
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
            <TouchableOpacity style={[styles.iconAction, { backgroundColor: colors.accent }]} activeOpacity={0.8} onPress={() => router.push('/ride/rideRecorder')}>
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
  iconAction: { flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 18, 
    paddingVertical: 8, 
    marginLeft: 10, 
    borderRadius: 14 },
  recordActionText: { marginLeft: 6, fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  headerAction: { paddingHorizontal: 10, paddingVertical: 8 },
  headerButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  cardBody: { padding: 16, gap: 10 },
  mapPreview: { width: '100%', height: 300, borderRadius: 4, backgroundColor: '#EAEAEA' },
  mapPreviewPlaceholder: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#F3F3F3', alignItems: 'center', justifyContent: 'center', gap: 6 },
  mapPreviewPlaceholderText: { fontSize: 13, fontWeight: '600' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 2 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 14 },
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
