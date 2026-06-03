import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { BlogServiceToken } from '@/services/blogService';
import type { BlogService } from '@/services/blogService';
import Blog from '@/models/blog';

export default function BlogDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const blogService = useMemo(() => container.resolve<BlogService>(BlogServiceToken), []);
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const [blog, setBlog] = useState<Blog | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    void (async () => {
      const result = await blogService.getBlogById(id);
      if (active) {
        setBlog(result ?? null);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, blogService]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.Title.blogs}</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {blog ? (
          <View style={[styles.page, { backgroundColor: colors.background }]}> 
            {blog.imageUrl ? <Image source={{ uri: blog.imageUrl }} style={styles.image} /> : null}
            <View style={styles.card}> 
              <Text style={[styles.headline, { color: colors.text }]}>{blog.title}</Text>
              <View style={styles.metaRow}>
                <MaterialIcons name="schedule" size={14} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{new Date(blog.dateTimeUTC ?? '').toLocaleDateString()}</Text>
              </View>
              <View style={styles.metaRow}>
                <MaterialIcons name="person" size={14} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{blog.author}</Text>
              </View>
              <Text style={[styles.bodyText, { color: colors.secondaryText }]}>{blog.content ?? blog.summary}</Text>
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
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'left' },
  content: { paddingHorizontal: 16, gap: 16 },
  page: { flex: 1, gap: 16 },
  image: { width: '100%', height: 220, borderRadius: 0 },
  card: { borderRadius: 0, borderWidth: 0, padding: 16, gap: 12 },
  headline: { fontSize: 22, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 12 },
  bodyText: { fontSize: 15, lineHeight: 22 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14 },
});
