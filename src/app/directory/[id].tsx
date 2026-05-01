import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import { container } from '@/services';
import { DirectoryServiceToken } from '@/services/directoryService';
import type { DirectoryService } from '@/services/directoryService';
import Directory from '@/models/directory';

export default function DirectoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const directoryService = useMemo(() => container.resolve<DirectoryService>(DirectoryServiceToken), []);
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const [item, setItem] = useState<Directory | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    void (async () => {
      const result = await directoryService.getDirectoryById(id);
      if (active) {
        setItem(result ?? null);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, directoryService]);

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

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>{t.Title.directory}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {item ? (
          <View style={[styles.page, { backgroundColor: colors.background }]}> 
            {item.coverImageUrl ? <Image source={{ uri: item.coverImageUrl }} style={styles.image} /> : null}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <ThemedText style={[styles.titleText, { color: colors.primary }]}>{item.name}</ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.secondary }]}>{item.businessType}</ThemedText>
              <View style={styles.row}>
                <MaterialIcons name="location-on" size={16} color={colors.secondary} />
                <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{item.address}</ThemedText>
              </View>
              <View style={styles.row}>
                <MaterialIcons name="phone" size={16} color={colors.secondary} />
                <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{item.phone}</ThemedText>
              </View>
              <View style={styles.row}>
                <MaterialIcons name="star" size={16} color={colors.secondary} />
                <ThemedText style={[styles.metaText, { color: colors.secondary }]}>{item.rating ?? 0} ({item.ratingCount ?? 0})</ThemedText>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>{t.Text.noListings}</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 22 },
  content: { paddingHorizontal: 16, gap: 16 },
  page: { flex: 1, gap: 16 },
  image: { width: '100%', height: 220, borderRadius: 18 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  titleText: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, lineHeight: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14 },
});
