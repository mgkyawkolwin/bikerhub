import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import MediaList from '@/components/mediaList';

export default function SocialMediaScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const router = useRouter();
  const params = useLocalSearchParams();

  const mediaParam = Array.isArray(params.media) ? params.media : params.media ? [params.media] : [];
  const initialIndex = params.index ? Number(params.index) : 0;

  const parseMediaItem = (item: string) => {
    const raw = item || '';
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      decoded = raw;
    }

    if (decoded.startsWith('[')) {
      try {
        const parsed = JSON.parse(decoded);
        return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [decoded];
      } catch {
        return [decoded];
      }
    }

    return [decoded];
  };

  const media = mediaParam.flatMap((item) => (typeof item === 'string' ? parseMediaItem(item) : []));

  const handleBack = () => {
    router.back();
  };

  if (!media.length) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}> 
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No media available.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={handleBack} hitSlop={12} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Media</Text>
      </View>
      <View style={styles.content}>
        <MediaList media={media} initialIndex={initialIndex} />
      </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
