import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuthContext } from '@/mobile/hooks/use-auth-context';
import { useThemeContext } from '@/mobile/hooks/use-theme-context';
import { ThemedText } from '@/mobile/components/themedText';
import { getDatabase, saveDatabase } from '@/services/localDatabase';

export default function RoutePlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewedUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const { getAuthUser } = useAuthContext();
  const authUser = getAuthUser();
  const currentUserId = authUser?.id;
  const isOwnPlans = !viewedUserId || viewedUserId === currentUserId;
  const { isDark } = useThemeContext();
  const [plans, setPlans] = useState<any[]>([]);

  const colors = {
    background: isDark ? '#000000' : '#F7F7F7',
    card: isDark ? '#121212' : '#FFFFFF',
    border: isDark ? '#232323' : '#E0E0E0',
    primary: isDark ? '#FFFFFF' : '#000000',
    secondary: isDark ? '#B0B0B0' : '#666666',
    accent: '#E85D04',
  };

  const loadPlans = useCallback(async () => {
    console.log('Loading plans for userId:', viewedUserId);
    const db = await getDatabase();
    const allPlans = db.collections.plans ?? [];
    console.log('All plans loaded:', allPlans);
    const filteredPlans = viewedUserId
      ? allPlans.filter((plan: any) => plan.createdById === viewedUserId || plan.userId === viewedUserId)
      : allPlans;
    console.log('Filtered plans:', filteredPlans);
    setPlans(filteredPlans);
  }, [viewedUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadPlans();
    }, [loadPlans]),
  );

  const confirmDeletePlan = (id: string) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void deletePlan(id) },
      ],
    );
  };

  const deletePlan = async (id: string) => {
    const db = await getDatabase();
    const collections = db.collections as any;
    collections.plans = (collections.plans ?? []).filter((plan: any) => plan.id !== id);
    await saveDatabase(db);
    setPlans(collections.plans);
  };

  const renderPlan = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push(`/ride/plan?id=${encodeURIComponent(item.id)}`)}
    >
      <View style={styles.planTouchable}>
        {/* Header with Plan Name and Date */}
        <View style={styles.planHeader}>
          <ThemedText style={[styles.planName, { color: colors.primary }]} numberOfLines={1}>
            {item.name ?? 'Unnamed Plan'}
          </ThemedText>
          <ThemedText style={[styles.planDate, { color: colors.secondary }]} numberOfLines={1}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}
          </ThemedText>
        </View>
        
        {/* Meta row with points, km, min AND trash icon */}
        <View style={styles.metaRow}>
          <ThemedText style={[styles.planSummary, { color: colors.secondary }]} numberOfLines={1}>
            {item.waypoints?.length 
              ? `${item.waypoints.length} points · ${item.totalDistance?.toFixed(1) ?? 0} km · ${item.totalDuration?.toFixed(0) ?? 0} min` 
              : 'No waypoints'}
          </ThemedText>
          <TouchableOpacity onPress={() => confirmDeletePlan(item.id)} style={styles.deleteButton}>
            <MaterialIcons name="delete" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
        
        {/* Description row below meta */}
        {item.description ? (
          <ThemedText style={[styles.planDescription, { color: colors.secondary }]} numberOfLines={2}>
            {item.description}
          </ThemedText>
        ) : null}
        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: colors.accent }]}
          activeOpacity={0.8}
          onPress={() => router.push(`/ride/planGoogle?id=${encodeURIComponent(item.id)}`)}
        >
          <ThemedText style={styles.viewButtonText}>View</ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, { color: colors.primary }]}>Plans</ThemedText>
        {isOwnPlans ? (
          <TouchableOpacity style={[styles.newPlanButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/ride/plan')} activeOpacity={0.8}>
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <ThemedText style={styles.newPlanText}>New Plan</ThemedText>
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
            <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>No plans saved yet.</ThemedText>
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