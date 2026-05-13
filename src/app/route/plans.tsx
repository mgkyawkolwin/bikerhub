import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import { getDatabase } from '@/services/localDatabase';

export default function RoutePlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    const db = await getDatabase();
    setPlans(db.collections.plans ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlans();
    }, [loadPlans]),
  );

  const renderPlan = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push(`/route/plan?id=${encodeURIComponent(item.id)}`)}
    >
      <View style={styles.planTouchable}> 
        <View style={styles.planHeader}>
          <ThemedText style={[styles.planName, { color: colors.primary }]} numberOfLines={1}>
            {item.name ?? 'Unnamed Plan'}
          </ThemedText>
          <ThemedText style={[styles.planDate, { color: colors.secondary }]} numberOfLines={1}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}
          </ThemedText>
        </View>
        <ThemedText style={[styles.planSummary, { color: colors.secondary }]} numberOfLines={2}>
          {item.waypoints?.length ? `${item.waypoints.length} points · ${item.totalDistance?.toFixed(1) ?? 0} km · ${item.totalDuration?.toFixed(0) ?? 0} min` : 'No waypoints'}
        </ThemedText>
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
        <TouchableOpacity style={[styles.newPlanButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/route/plan')} activeOpacity={0.8}>
          <MaterialIcons name="add" size={18} color="#FFFFFF" />
          <ThemedText style={styles.newPlanText}>New Plan</ThemedText>
        </TouchableOpacity>
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
    padding: 0,
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
  planSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    marginTop: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});