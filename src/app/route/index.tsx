import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import { container } from '@/services';
import { RouteServiceToken } from '@/services/routeService';
import type { RouteService } from '@/services/routeService';
import Route from '@/models/route';

export default function RouteListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const routeService = useMemo(() => container.resolve<RouteService>(RouteServiceToken), []);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#F7F7F7',
      card: isDark ? '#121212' : '#FFFFFF',
      border: isDark ? '#232323' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const loadRoutes = useCallback(
    async (pageNumber: number, reset = false) => {
      setLoading(true);
      try {
        const result = await routeService.getRoutes(pageNumber, 10);
        setRoutes((prev) => (reset ? result.items : [...prev, ...result.items]));
        setPage(result.page);
        setTotal(result.total);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [routeService],
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
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <ThemedText style={[styles.cardTitle, { color: colors.primary }]}>{item.name}</ThemedText>
          <View style={[styles.badge, { backgroundColor: colors.accent }]}> 
            <ThemedText style={styles.badgeText}>{item.type}</ThemedText>
          </View>
        </View>
        <View style={styles.metaRow}> 
          <MaterialIcons name="schedule" size={14} color={colors.secondary} />
          <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{t.Title.duration}: {item.duration}</ThemedText>
        </View>
        <View style={styles.metaRow}> 
          <MaterialIcons name="straighten" size={14} color={colors.secondary} />
          <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{t.Title.distance}: {item.distance}</ThemedText>
        </View>
        {item.createdByName ? (
          <View style={styles.metaRow}>
            <MaterialIcons name="person" size={14} color={colors.secondary} />
            <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{t.Title.createdBy}: {item.createdByName}</ThemedText>
          </View>
        ) : null}
        <ThemedText style={[styles.cardSummary, { color: colors.secondary }]} numberOfLines={3}>{item.description}</ThemedText>
      </View>
      {item.gpxUrl ? (
        <TouchableOpacity
          onPress={() => {
            if (item.gpxUrl) {
              void Linking.openURL(item.gpxUrl);
            }
          }}
          style={[styles.downloadButton, { borderColor: colors.accent, backgroundColor: colors.accent }]}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.downloadText}>Open</ThemedText>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { backgroundColor: colors.background }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, { color: colors.primary }]}>{t.Title.routes}</ThemedText>
        <TouchableOpacity style={styles.headerAction} onPress={() => router.push('/route/create')}>
          <ThemedText style={[styles.headerButton, {backgroundColor: colors.accent}]}>Record Ride</ThemedText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={renderRoute}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>{t.Text.noRoutes}</ThemedText>
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
  headerAction: { paddingHorizontal: 10, paddingVertical: 8 },
  headerButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  cardBody: { padding: 16, gap: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  badge: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
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
