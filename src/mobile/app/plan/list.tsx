import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, Text, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { PlanServiceToken } from '@/services/planService';
import type { PlanService } from '@/services/planService';
import type Plan from '@/models/plan';

export default function PlanListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeContext();
  const planService = useMemo(() => container.resolve<PlanService>(PlanServiceToken), []);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadPlans = useCallback(
    async (pageNumber: number, reset = false) => {
      setLoading(true);
      try {
        const response = await planService.getPlans(pageNumber, 20);
        const responseJson = await response.json().catch(() => null);
        const success = responseJson?.success ?? responseJson?.Success;
        const data = responseJson?.data ?? responseJson?.Data;

        if (!response.ok || !success || !data) {
          const message = responseJson?.message ?? responseJson?.Message ?? 'Failed to load plans.';
          throw new Error(message);
        }

        const items: Plan[] = Array.isArray(data.items) ? data.items : [];
        setPlans((prev) => (reset ? items : [...prev, ...items]));
        setPage(data.page ?? pageNumber);
        setTotal(data.total ?? items.length);
      } catch (error) {
        console.error('Failed to load plans:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Unable to load plans.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [planService],
  );

  useFocusEffect(
    useCallback(() => {
      void loadPlans(1, true);
    }, [loadPlans]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadPlans(1, true);
  };

  const handleEndReached = () => {
    if (!loading && plans.length < total) {
      void loadPlans(page + 1);
    }
  };

  const renderPlan = ({ item }: { item: Plan }) => {
    const tripDateTime = item.tripDateTimeUtc ? new Date(item.tripDateTimeUtc).toLocaleString() : 'Date not set';
    const confirmedCount = item.confirmedCount ?? 0;
    const maybeCount = item.maybeCount ?? 0;

    const hasMapImage = Boolean(item.staticMapUrl);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          if (item.id) {
            void router.push({ pathname: '/plan/view', params: { id: item.id } });
          }
        }}
      >
        <View style={styles.imageWrapper}>
          {hasMapImage ? (
            <Image
              source={{ uri: item.staticMapUrl }}
              style={styles.mapImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}> 
              <MaterialIcons name="map" size={42} color={colors.text} />
              <Text style={[styles.placeholderLabel, { color: colors.secondaryText }]}>Plan image</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title ?? 'Untitled Plan'}
          </Text>
          <Text style={[styles.cardDate, { color: colors.secondaryText }]} numberOfLines={1}>
            {tripDateTime}
          </Text>
          {item.description ? (
            <Text style={[styles.cardDescription, { color: colors.secondaryText }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.countItem}>
            <MaterialIcons name="check-circle" size={16} color={colors.accent} />
            <Text style={[styles.countLabel, { color: colors.text }]}>{confirmedCount} confirmed</Text>
          </View>
          <View style={styles.countItem}>
            <MaterialIcons name="help-outline" size={16} color={colors.text} />
            <Text style={[styles.countLabel, { color: colors.text }]}>{maybeCount} may be</Text>
          </View>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.border }]}
            onPress={(event) => {
              event.stopPropagation();
              if (item.id) {
                void router.push({ pathname: '/plan/edit', params: { planId: item.id } });
              }
            }}
            hitSlop={8}
          >
            <MaterialIcons name="edit" size={16} color={colors.text} />
            <Text style={[styles.editButtonText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Plans</Text>
        <TouchableOpacity onPress={() => router.push('/plan/create')} hitSlop={14} style={styles.headerButton}>
          <MaterialIcons name="add" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id ?? `${item.title ?? 'plan'}-${item.tripDateTimeUtc ?? page}`}
        renderItem={renderPlan}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No plans available.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapImage: {
    width: '100%',
    height: 160,
  },
  placeholderImage: {
    width: '100%',
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholderLabel: {
    marginTop: 8,
    fontSize: 14,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 13,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
