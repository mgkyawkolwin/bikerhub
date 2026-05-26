import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/mobile/i18n';
import { useThemeContext } from '@/mobile/hooks/use-theme-context';
import { ThemedText } from '@/mobile/components/themedText';
import { container } from '@/services';
import { StolenBikeServiceToken } from '@/services/stolenBikeService';
import type { StolenBikeService } from '@/services/stolenBikeService';
import type { StolenBikeReport } from '@/models/stolenBikeReport';

export default function StolenListScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const stolenBikeService = useMemo(
    () => container.resolve<StolenBikeService>(StolenBikeServiceToken),
    [],
  );
  const [reports, setReports] = useState<StolenBikeReport[]>([]);
  const [loading, setLoading] = useState(false);

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#FFFFFF',
      card: isDark ? '#121212' : '#F7F7F7',
      border: isDark ? '#232323' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const result = await stolenBikeService.getReports();
      setReports(result);
    } finally {
      setLoading(false);
    }
  }, [stolenBikeService]);

  function openFilter() {
    router.push('/marketplace/filter');
  }

  function openReportForm() {
    router.push('/marketplace/reportStolen');
  }

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports]),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>{t.Title.stolenList}</ThemedText>
        <View style={styles.headerRightRow}>
          <TouchableOpacity style={styles.reportTopButton} onPress={openReportForm} hitSlop={12}>
            <ThemedText style={[styles.reportTopButtonText, { color: colors.primary }]}>Report</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={openFilter} hitSlop={12}>
            <MaterialIcons name="tune" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id ?? ''}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="warning-amber" size={48} color={colors.secondary} />
              <ThemedText style={[styles.emptyText, { color: colors.secondary, marginTop: 12 }]}>No stolen reports yet.</ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
            ) : null}
            <View style={styles.cardContent}>
              <ThemedText style={[styles.cardTitle, { color: colors.primary }]}>{item.title}</ThemedText>
              <ThemedText style={[styles.cardSubtitle, { color: colors.secondary }]}>{`${item.make} ${item.model} • ${item.year}`}</ThemedText>
              <View style={styles.metaRow}>
                <MaterialIcons name="location-on" size={14} color={colors.secondary} />
                <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{item.location}</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <MaterialIcons name="schedule" size={14} color={colors.secondary} />
                <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{new Date(item.reportedAt ?? '').toLocaleDateString()}</ThemedText>
              </View>
            </View>
          </View>
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
