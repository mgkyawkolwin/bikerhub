import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { DirectoryServiceToken } from '@/services/directoryService';
import type { DirectoryService } from '@/services/directoryService';
import Directory from '@/models/directory';

export default function DirectoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.Title.directory}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {item ? (
          <View style={[styles.page, { backgroundColor: colors.background }]}> 
            {item.coverImageUrl ? <Image source={{ uri: item.coverImageUrl }} style={styles.image} /> : null}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.titleText, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{item.businessType}</Text>
              <View style={styles.row}>
                <MaterialIcons name="location-on" size={16} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.address}</Text>
              </View>
              <View style={styles.row}>
                <MaterialIcons name="phone" size={16} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.phone}</Text>
              </View>
              <View style={styles.row}>
                <MaterialIcons name="star" size={16} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.rating ?? 0} ({item.ratingCount ?? 0})</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>{t.Text.noListings}</Text>
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
  image: { width: '100%', height: 220, borderRadius: 8 },
  card: { borderRadius: 8, borderWidth: 1, padding: 16, gap: 12 },
  titleText: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, lineHeight: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14 },
});
