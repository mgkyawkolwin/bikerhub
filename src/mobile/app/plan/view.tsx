import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container } from '@/services';
import { PlanServiceToken } from '@/services/planService';
import type { PlanService } from '@/services/planService';
import type Plan from '@/models/plan';

export default function PlanViewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useThemeContext();
  const { authUser } = useAuthContext();
  const planService = useMemo(() => container.resolve<PlanService>(PlanServiceToken), []);

  const planId = useMemo(() => {
    const value = Array.isArray(params.id) ? params.id[0] : params.id;
    return value ? String(value) : null;
  }, [params]);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!planId) return;
    setLoading(true);

    try {
      const response = await planService.getPlanById(planId);
      const responseJson = await response.json().catch(() => null);
      const success = responseJson?.success ?? responseJson?.Success;
      const data = responseJson?.data ?? responseJson?.Data;

      if (!response.ok || !success || !data) {
        const message = responseJson?.message ?? responseJson?.Message ?? 'Unable to load plan.';
        throw new Error(message);
      }

      setPlan(data as Plan);
    } catch (error) {
      console.error('Failed to load plan:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to load plan.');
    } finally {
      setLoading(false);
    }
  }, [planId, planService]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const isOwner = Boolean(plan?.createdById && authUser?.id && plan.createdById === authUser.id);
  const currentUserAttendance = plan?.riders?.find((rider) => rider.userId === authUser?.id);

  const handleJoin = async (confirmed: boolean) => {
    if (!plan?.id || submitting) return;

    setSubmitting(true);
    try {
      const response = await planService.updatePlanAttendance(plan.id, confirmed);
      const responseJson = await response.json().catch(() => null);
      const success = responseJson?.success ?? responseJson?.Success;
      const data = responseJson?.data ?? responseJson?.Data;

      if (!response.ok || !success || !data) {
        const message = responseJson?.message ?? responseJson?.Message ?? 'Unable to update plan attendance.';
        throw new Error(message);
      }

      setPlan(data as Plan);
    } catch (error) {
      console.error('Failed to update attendance:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to update attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Date not set';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date not set' : date.toLocaleString();
  };

  const riderList = plan?.riders ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Plan</Text>
        {isOwner ? (
          <TouchableOpacity onPress={() => plan?.id && router.push({ pathname: '/plan/edit', params: { planId: plan.id } })} hitSlop={14}>
            <MaterialIcons name="edit" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          {plan ? (
            <>
              {plan.staticMapUrl ? (
                <Image source={{ uri: plan.staticMapUrl }} style={styles.mapImage} resizeMode="cover" />
              ) : (
                <View style={[styles.placeholderMap, { backgroundColor: colors.border }]}> 
                  <MaterialIcons name="map" size={42} color={colors.text} />
                  <Text style={[styles.placeholderText, { color: colors.secondaryText }]}>Route map</Text>
                </View>
              )}

              <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>{plan.title ?? 'Untitled plan'}</Text>

                <View style={styles.metaRow}>
                  <MaterialIcons name="event" size={18} color={colors.secondaryText} />
                  <Text style={[styles.metaText, { color: colors.secondaryText }]}>{formatDate(plan.tripDateTimeUtc)}</Text>
                </View>

                {plan.description ? (
                  <Text style={[styles.description, { color: colors.secondaryText }]}>{plan.description}</Text>
                ) : null}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: currentUserAttendance?.confirmed ? colors.accent : colors.border }]}
                    onPress={() => void handleJoin(true)}
                    disabled={submitting}
                  >
                    <Text style={[styles.actionText, { color: currentUserAttendance?.confirmed ? '#FFFFFF' : colors.text }]}>Join</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: currentUserAttendance && !currentUserAttendance.confirmed ? colors.accent : colors.border }]}
                    onPress={() => void handleJoin(false)}
                    disabled={submitting}
                  >
                    <Text style={[styles.actionText, { color: currentUserAttendance && !currentUserAttendance.confirmed ? '#FFFFFF' : colors.text }]}>May Be</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{plan.confirmedCount ?? 0}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Confirmed</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{plan.maybeCount ?? 0}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>May be</Text>
                  </View>
                </View>

                <View style={[styles.riderSection, { borderTopColor: colors.border }]}> 
                  <Text style={[styles.riderTitle, { color: colors.text }]}>Riders</Text>
                  {riderList.length > 0 ? (
                    riderList.map((rider) => {
                      const isConfirmed = rider.confirmed ?? false;
                      return (
                        <View key={`${rider.userId ?? 'unknown'}-${isConfirmed ? 'confirmed' : 'maybe'}`} style={[styles.riderRow, { borderBottomColor: colors.border }]}> 
                          <Image
                            source={{ uri: rider.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(rider.displayName ?? 'Rider') }}
                            style={styles.avatar}
                          />
                          <Text style={[styles.riderName, { color: colors.text }]}>{rider.displayName ?? 'Rider'}</Text>
                          <View style={[styles.badge, { backgroundColor: isConfirmed ? colors.accent : colors.border }]}> 
                            <Text style={[styles.badgeText, { color: isConfirmed ? '#FFFFFF' : colors.text }]}>{isConfirmed ? 'Confirmed' : 'Maybe'}</Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No riders yet.</Text>
                  )}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Plan not found.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSpacer: { width: 22 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapImage: { width: '100%', height: 220 },
  placeholderMap: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholderText: { marginTop: 8, fontSize: 14 },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14 },
  description: { fontSize: 15, lineHeight: 22 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontWeight: '700', fontSize: 15 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryItem: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 12, marginTop: 4 },
  riderSection: { paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  riderTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  riderName: { flex: 1, fontSize: 15, fontWeight: '600' },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
