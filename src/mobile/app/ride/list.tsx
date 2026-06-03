import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { ThemedText } from '@/components/themedText';
import { container } from '@/services';
import { RouteServiceToken } from '@/services/routeService';
import { getDatabase, saveDatabase } from '@/services/localDatabase';
import { setRouteDraft } from '@/services/routeTransfer';
import type { RouteService } from '@/services/routeService';
import Route from '@/models/route';

export default function RouteListScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const { getAuthUser } = useAuthContext();
  const authUser = getAuthUser();
  const viewedUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const routeService = useMemo(() => container.resolve<RouteService>(RouteServiceToken), []);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { colors } = useThemeContext();

  const loadRoutes = useCallback(
    async (pageNumber: number, reset = false) => {
      setLoading(true);
      try {
        console.log('Loading routes for userId:', viewedUserId);
        if (viewedUserId) {
          const db = await getDatabase();
          const allRoutes = (db.collections.routes as Route[] | undefined) ?? [];
          console.log('All routes loaded:', allRoutes);
          const filteredRoutes = allRoutes.filter(
            (route) => route.createdById === viewedUserId,
          );
          console.log('Filtered routes:', filteredRoutes);
          setRoutes(filteredRoutes);
          setPage(1);
          setTotal(filteredRoutes.length);
        } else {
          // const result = await routeService.getRoutes(pageNumber, 10);
          setRoutes([]);
          setPage(0);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [routeService, viewedUserId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadRoutes(1, true);
    }, [loadRoutes]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadRoutes(1, true);
  };

  const handleEndReached = () => {
    if (!loading && routes.length < total) {
      void loadRoutes(page + 1);
    }
  };

  const renderRoute = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => loadRide(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <ThemedText style={[styles.cardTitle, { color: colors.text }]}>{item.name}</ThemedText>
          {isOwnRoutes ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDeleteRoute(item.id ?? '')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete" size={20} color={colors.accent} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.metaRow}> 
          <MaterialIcons name="schedule" size={14} color={colors.secondaryText} />
          <ThemedText style={[styles.metaText, { color: colors.secondaryText }]}>{t.Title.duration}: {item.duration}</ThemedText>
        </View>
        <View style={styles.metaRow}> 
          <MaterialIcons name="straighten" size={14} color={colors.secondaryText} />
          <ThemedText style={[styles.metaText, { color: colors.secondaryText }]}>{t.Title.distance}: {item.distance}</ThemedText>
        </View>
        {item.createdByName ? (
          <View style={styles.metaRow}>
            <MaterialIcons name="person" size={14} color={colors.secondaryText} />
            <ThemedText style={[styles.metaText, { color: colors.secondaryText }]}>{t.Title.createdBy}: {item.createdByName}</ThemedText>
          </View>
        ) : null}
        <ThemedText style={[styles.cardSummary, { color: colors.secondaryText }]} numberOfLines={3}>{item.description}</ThemedText>
      </View>
      <TouchableOpacity
        onPress={() => {
          if (item.gpxUrl) {
            void Linking.openURL(item.gpxUrl);
          } else {
            loadRide(item);
          }
        }}
        style={[styles.downloadButton, { borderColor: colors.accent, backgroundColor: colors.accent }]}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.downloadText}>View</ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const currentUserId = authUser?.id;
  const isOwnRoutes = !viewedUserId || viewedUserId === currentUserId;

  const parseDistance = (distanceText?: string): number => {
    if (!distanceText) return 0;
    const match = distanceText.match(/([0-9.]+)/);
    return match ? Number(match[1]) : 0;
  };

  const loadRide = (item: Route) => {
    const ride = item as any;
    const draft = {
      locations: ride.locations ?? ride.routePath ?? [],
      routePath: ride.routePath ?? ride.locations ?? [],
      totalDistance: parseDistance(ride.distance),
      totalDuration: 0,
      osrmResponse: ride.osrmResponse,
    };
    setRouteDraft(draft);
    router.push('/ride/rides');
  };

  const confirmDeleteRoute = (routeId: string) => {
    Alert.alert(
      'Delete Ride',
      'Are you sure you want to delete this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void deleteRoute(routeId),
        },
      ],
    );
  };

  const deleteRoute = async (routeId: string) => {
    try {
      const db = await getDatabase();
      const collections = db.collections as any;
      collections.routes = (collections.routes ?? []).filter((route: any) => route.id !== routeId);
      await saveDatabase(db);
      setRoutes((prev) => prev.filter((route) => route.id !== routeId));
    } catch (error) {
      console.error('Error deleting route:', error);
      Alert.alert('Error', 'Unable to delete ride.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { backgroundColor: colors.background }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, { color: colors.text }]}>Rides</ThemedText>
        <View style={styles.actionsRow}>
          {isOwnRoutes ? (
            <TouchableOpacity style={[styles.iconAction, { backgroundColor: colors.accent }]} activeOpacity={0.8} onPress={() => router.push('/ride/rides')}>
              <MaterialIcons name="directions-bike" size={18} color="#FFFFFF" />
              <ThemedText style={styles.recordActionText}>Ride</ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderRoute}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.secondaryText }]}>{t.Text.noRoutes}</ThemedText>
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
