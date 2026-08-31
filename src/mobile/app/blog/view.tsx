import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { BlogServiceToken } from '@/services/blogService';
import type { BlogService } from '@/services/blogService';
import type Blog from '@/models/blog';
import { WebView } from 'react-native-webview';

export default function BlogViewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useThemeContext();
  const blogService = useMemo(() => container.resolve<BlogService>(BlogServiceToken), []);

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(false);

  const blogId = Array.isArray(params.id) ? params.id[0] : params.id;

  const loadBlog = useCallback(async () => {
    if (!blogId) return;
    setLoading(true);
    try {
      const response = await blogService.getBlogById(blogId);
      const responseJson = await response.json().catch(() => null);
      const success = responseJson?.success ?? responseJson?.Success;
      const data = responseJson?.data;

      if (!response.ok || !success || !data) {
        const message = responseJson?.message ?? responseJson?.Message ?? 'Failed to load blog.';
        throw new Error(message);
      }

      setBlog(data as Blog);
    } catch (error) {
      console.error('Failed to load blog:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to load blog.');
    } finally {
      setLoading(false);
    }
  }, [blogId, blogService]);

  useEffect(() => {
    void loadBlog();
  }, [loadBlog]);

  const createdBy = blog?.authorName ?? 'Unknown';
  const publishedOn = blog?.createdAtUtc ? new Date(blog.createdAtUtc).toLocaleDateString() : 'Unknown';
  const coverImage = blog?.coverImageUrl;
  const badgeText = blog?.postType ?? 'General';
  const contentHtml = blog?.content ?? '<p>No content available.</p>';

  const htmlSource = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><style>body{margin:0;padding:16px;color:${colors.text};background-color:${colors.background};font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;}img{max-width:100%;height:auto;}p{line-height:1.6;}a{color:${colors.accent};}</style></head><body>${contentHtml}</body></html>`;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Blog</Text>
      </View>

      {coverImage ? (
        <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
      ) : null}

      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: colors.text }]}>{blog?.title ?? 'Untitled'}</Text>
        <View style={[styles.badge, { backgroundColor: colors.accent }]}> 
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      </View>

      <View style={[styles.metaSection, { borderBottomColor: colors.border }]}> 
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>Author Name</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{createdBy}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>Published On</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{publishedOn}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <WebView
          originWhitelist={[ '*' ]}
          source={{ html: htmlSource }}
          style={styles.webview}
          containerStyle={{ backgroundColor: colors.background }}
        />
      )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  coverImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  badge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  metaRow: {
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  metaValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
