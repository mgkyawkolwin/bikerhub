import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { StolenBikeServiceToken } from '@/services/stolenBikeService';
import type { StolenBikeService } from '@/services/stolenBikeService';
import type { BikeType, MarketplaceFilter } from '@/models/marketplace';
import type { StolenBikeReport } from '@/models/stolenBikeReport';
import SnackBar from '@/components/snackbar';
import StolenCardItem from './stolencarditem';

function getParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? '';
}

export default function StolenListScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const params = useLocalSearchParams();
  const stolenBikeService = useMemo(
    () => container.resolve<StolenBikeService>(StolenBikeServiceToken),
    [],
  );

  const filter: MarketplaceFilter = useMemo(
    () => ({
      make: getParamValue(params.make),
      model: getParamValue(params.model),
      modelYear: getParamValue(params.modelYear),
      priceMin: getParamValue(params.priceMin),
      priceMax: getParamValue(params.priceMax),
      cc: getParamValue(params.cc),
      type: getParamValue(params.type) as BikeType | undefined,
      city: getParamValue(params.city),
      country: getParamValue(params.country),
    } as any as MarketplaceFilter),
    [
      params.make,
      params.model,
      params.modelYear,
      params.priceMin,
      params.priceMax,
      params.cc,
      params.type,
      params.city,
      params.country,
    ],
  );

  const [reports, setReports] = useState<StolenBikeReport[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(
    async (currentFilter: MarketplaceFilter, pageNumber = 1, reset = false) => {
      setLoading(true);
      try {
        const response = await stolenBikeService.getReports(currentFilter, pageNumber, 10);
        if (!response.ok) {
          SnackBar.Error('Request failed. Please try again later.');
          return;
        }
        const responseJson = await response.json();
        console.log('Load Reports Response:', responseJson);
        if (!responseJson.success) {
          SnackBar.Error(responseJson.message || 'Failed response. Please try again later.');
          return;
        }
        const responseData = responseJson.data as {
          items: StolenBikeReport[];
          page: number;
          pageSize: number;
          total: number;
          totalPages?: number;
        };

        setReports((prev) => (reset ? responseData.items : [...prev, ...responseData.items]));
        setPage(responseData.page ?? pageNumber);
        setTotalPages(responseData.totalPages ?? Math.max(1, Math.ceil((responseData.total ?? 0) / (responseData.pageSize ?? 10))));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [stolenBikeService],
  );

  function openFilter() {
    router.push({
      pathname: '/marketplace/stolenbikefilter',
      params: {
        make: filter.make,
        model: filter.model,
        modelYear: filter.modelYear,
        priceMin: filter.priceMin?.toString(),
        priceMax: filter.priceMax?.toString(),
        cc: filter.cc,
        type: filter.type,
        city: filter.city,
        country: filter.country,
      },
    });
  }

  function openReportForm() {
    router.push('/marketplace/reportStolen');
  }

  useFocusEffect(
    useCallback(() => {
      void loadReports(filter, 1, true);
    }, [loadReports, filter]),
  );

  function handleRefresh() {
    setRefreshing(true);
    void loadReports(filter, 1, true);
  }

  function handleEndReached() {
    if (!loading && page < totalPages) {
      void loadReports(filter, page + 1, false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.Title.stolenList}</Text>
        <View style={styles.headerRightRow}>
          <TouchableOpacity style={styles.reportTopButton} onPress={openReportForm} hitSlop={12}>
            <Text style={[styles.reportTopButtonText, { color: colors.text }]}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={openFilter} hitSlop={12}>
            <MaterialIcons name="tune" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id ?? ''}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="warning-amber" size={48} color={colors.secondaryText} />
              <Text style={[styles.emptyText, { color: colors.secondaryText, marginTop: 12 }]}>No stolen reports yet.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <StolenCardItem
            item={item}
            onPress={() => {
              if (!item.id) return;
              router.push(`/marketplace/stolen/${item.id}`);
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 24,
  },
  reportTopButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  reportTopButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
