import React, { useMemo, useState } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { SocialServiceClient, SocialServiceToken } from '@/services/socialService';
import MediaList from '@/components/mediaList';
import PopupMenu from '@/components/popupMenu';
import SnackBar from '@/components/snackbar';

export default function SocialMediaScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const router = useRouter();
  const params = useLocalSearchParams();

  const mediaParam = Array.isArray(params.media) ? params.media : params.media ? [params.media] : [];
  const initialIndex = params.index ? Number(params.index) : 0;
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId;
  const canDelete = params.canDelete === 'true';
  const socialService = useMemo(() => container.resolve<SocialServiceClient>(SocialServiceToken), []);

  type MediaItem = { id?: string; uri: string; contentType?: string };

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
        if (Array.isArray(parsed)) {
          return parsed
            .map((value) => {
              if (typeof value === 'string') {
                return { uri: value };
              }
              if (typeof value === 'object' && value !== null) {
                return {
                  id: typeof (value as any).id === 'string' ? (value as any).id : undefined,
                  uri: typeof (value as any).url === 'string' ? (value as any).url : typeof (value as any).uri === 'string' ? (value as any).uri : '',
                  contentType: typeof (value as any).contentType === 'string' ? (value as any).contentType : undefined,
                };
              }
              return null;
            })
            .filter((value): value is MediaItem => value !== null && typeof value.uri === 'string');
        }
      } catch {
        // fall through
      }
    }

    return [{ uri: decoded }];
  };

  const [media, setMedia] = useState<MediaItem[]>(() =>
    mediaParam.flatMap((item) => (typeof item === 'string' ? parseMediaItem(item) : [])),
  );
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

  const getSelectedMedia = () => (selectedMediaIndex !== null ? media[selectedMediaIndex] : null);

  const confirmDeleteMedia = async (item: MediaItem, index: number) => {
    console.debug('Attempting to delete media:', item, 'at index:', index);
    if (!postId || !item.id) {
      SnackBar.Error('Unable to delete this media.');
      return;
    }

    try {
      const response = await socialService.deletePostMedia(postId, item.id!);
      if (!response.ok) {
        SnackBar.Error('Unable to delete media.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to delete media.');
        return;
      }

      setMedia((prev) => prev.filter((_, idx) => idx !== index));
    } catch (error) {
      console.error('Failed to delete media:', error);
      SnackBar.Error('Unable to delete media.');
    }
  };

  const handleDeleteMedia = (item: MediaItem, index: number) => {
    Alert.alert('Delete media', 'Are you sure you want to delete this media from the post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void confirmDeleteMedia(item, index),
      },
    ]);
  };

  const handleOpenMedia = (item: MediaItem) => {
    if (!item.uri) return;
    router.push(
      `/social/photoViewer?url=${encodeURIComponent(item.uri)}&title=${encodeURIComponent('Media')}`,
    );
  };

  const handleMenuPress = (item: MediaItem, index: number) => {
    setSelectedMediaIndex(index);
    setMenuVisible(true);
  };

  const handleCloseMenu = () => {
    setMenuVisible(false);
    setSelectedMediaIndex(null);
  };

  const handleViewSelectedMedia = () => {
    const selected = getSelectedMedia();
    if (!selected?.uri) {
      handleCloseMenu();
      return;
    }

    handleCloseMenu();
    router.push(
      `/social/photoViewer?url=${encodeURIComponent(selected.uri)}&title=${encodeURIComponent('Media')}`,
    );
  };

  const handleDeleteSelectedMedia = () => {
    const selected = getSelectedMedia();
    const selectedIndex = selectedMediaIndex;

    if (!selected || selectedIndex === null) {
      handleCloseMenu();
      return;
    }

    handleDeleteMedia(selected, selectedIndex);
    handleCloseMenu();
  };

  const handleBack = () => {
    router.back();
  };

  const handleMediaPress = (item: MediaItem) => {
    handleOpenMedia(item);
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
        <MediaList
          media={media}
          initialIndex={initialIndex}
          canDelete={canDelete}
          onMediaPress={(_, index) => {
            const item = media[index];
            handleOpenMedia(item);
          }}
          onMenuPress={handleMenuPress}
        />
      </View>
      <PopupMenu
        visible={menuVisible}
        onClose={handleCloseMenu}
        items={[
          { label: 'Delete', destructive: true, onPress: handleDeleteSelectedMedia },
          { label: 'View', onPress: handleViewSelectedMedia },
          { label: 'Cancel', onPress: handleCloseMenu },
        ]}
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
