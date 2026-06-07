import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { RouteServiceToken } from '@/services/routeService';
import type { RouteService } from '@/services/routeService';
import Route from '@/models/route';

type RouteWithMeta = Route & {
  createdAt?: string;
  userId?: string;
};

export default function RoutePlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewedUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const { getAuthUser } = useAuthContext();
  const authUser = getAuthUser();
  const currentUserId = authUser?.id;
  const isOwnPlans = !viewedUserId || viewedUserId === currentUserId;
  const { colors } = useThemeContext();
  const routeService = useMemo(() => container.resolve<RouteService>(RouteServiceToken), []);
  const [plans, setPlans] = useState<RouteWithMeta[]>([]);

  const parseNumber = (value?: string | number): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const loadPlans = useCallback(async () => {
    console.log('Loading plans for userId:', viewedUserId);
    try {
      const response = await routeService.getRoutes(1, 10);
      if (!response.ok) {
        console.error('Route service response error', response.status, response.statusText);
        setPlans([]);
        return;
      }

      const body = await response.json();
      const data = body?.Data?.items ?? body?.Data?.Items ?? body?.data?.items ?? body?.data?.Items ?? [];
      const routes = Array.isArray(data)
        ? (data as RouteWithMeta[]).map((route) => ({
            ...route,
            id: route.id ? String(route.id) : undefined,
            createdAt: route.createdAt ? String(route.createdAt) : undefined,
          }))
        : [];
      const filteredPlans = viewedUserId
        ? routes.filter((plan) => plan.createdById === viewedUserId)
        : routes;

      console.log('Loaded backend plans:', filteredPlans);
      setPlans(filteredPlans);
    } catch (error) {
      console.error('Failed to load plans from backend', error);
      setPlans([]);
    }
  }, [routeService, viewedUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadPlans();
    }, [loadPlans]),
  );


  const renderPlan = ({ item }: { item: RouteWithMeta }) => (
    <TouchableOpacity
      style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => {
        if (item.id) {
          router.push(`/ride/plan?id=${encodeURIComponent(item.id)}`);
        }
      }}
    >
      <View style={styles.planTouchable}>
        {/* Header with Plan Name and Date */}
        <View style={styles.planHeader}>
          <Text style={[styles.planName, { color: colors.text }]} numberOfLines={1}>
            {item.name ?? 'Unnamed Plan'}
          </Text>
          <Text style={[styles.planDate, { color: colors.secondaryText }]} numberOfLines={1}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
        
        <View style={styles.metaRow}>
          <Text style={[styles.planSummary, { color: colors.secondaryText }]} numberOfLines={1}>
            {item.distance || item.duration
              ? `${(parseNumber(item.distance)/1000).toFixed(1)} km · ${(parseNumber(item.duration)/60).toFixed(0)} min`
              : 'No route data'}
          </Text>
        </View>
        
        {/* Description row below meta */}
        {item.description ? (
          <Text style={[styles.planDescription, { color: colors.secondaryText }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: colors.accent }]}
          activeOpacity={0.8}
          onPress={() => {
            if (item.id) {
              router.push(`/ride/plan?id=${encodeURIComponent(item.id)}`);
            }
          }}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Plans</Text>
        {isOwnPlans ? (
          <TouchableOpacity style={[styles.newPlanButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/ride/plan')} activeOpacity={0.8}>
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newPlanText}>New Plan</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id ?? String(item.createdAt ?? Math.random())}
        renderItem={renderPlan}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No plans saved yet.</Text>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  newPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  newPlanText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  itemSeparator: {
    height: 12,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  planTouchable: {
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  planDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10, // Space before description
  },
  planSummary: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
    marginBottom: 12,
  },
  viewButton: {
    marginTop: 12,
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    marginTop: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});