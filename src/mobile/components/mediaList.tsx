import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useThemeContext } from '@/hooks/use-theme-context';

type MediaItem = {
  id?: string;
  uri: string;
  contentType?: string;
};

type MediaListProps = {
  media: MediaItem[];
  initialIndex?: number;
  onMediaPress?: (item: MediaItem, index: number) => void;
  onMenuPress?: (item: MediaItem, index: number) => void;
  canDelete?: boolean;
};

const ITEM_HEIGHT = 320;

function VideoPlayerView({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri || 'https://example.com/placeholder.mp4');
  return <VideoView player={player} style={style} contentFit="contain" nativeControls />;
}

function MediaRenderer({ item, style }: { item: MediaItem; style: any }) {
  const isVideo = Boolean(item.contentType?.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(item.uri ?? ''));

  if (!item.uri) {
    return <Image source={undefined} style={style} resizeMode="cover" />;
  }

  if (isVideo) {
    return <VideoPlayerView uri={item.uri} style={style} />;
  }

  return <Image source={{ uri: item.uri }} style={style} resizeMode="cover" />;
}

export default function MediaList({ media, initialIndex = 0, onMediaPress, onMenuPress, canDelete = false }: MediaListProps) {
  const { colors } = useThemeContext();
  const listRef = useRef<FlatList<MediaItem>>(null);

  const parsedMedia = useMemo(() => media ?? [], [media]);

  useEffect(() => {
    if (!listRef.current || initialIndex <= 0 || initialIndex >= parsedMedia.length) {
      return;
    }

    listRef.current.scrollToIndex({ index: initialIndex, animated: false });
  }, [initialIndex, parsedMedia.length]);

  const renderMediaItem = ({ item, index }: { item: MediaItem; index: number }) => {
    const isVideo = Boolean(item.contentType?.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(item.uri ?? ''));
    const mediaContent = <MediaRenderer item={item} style={styles.mediaImage} />;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        {isVideo ? (
          <View style={styles.mediaWrapper}>{mediaContent}</View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onMediaPress?.(item, index)}
            style={styles.mediaWrapper}
          >
            {mediaContent}
          </TouchableOpacity>
        )}
        {onMenuPress && canDelete ? (
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.card + 'CC' }]}
            onPress={() => onMenuPress(item, index)}
          >
            <MaterialIcons name="more-vert" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={parsedMedia}
      keyExtractor={(item, index) => item.id ?? item.uri ?? index.toString()}
      renderItem={renderMediaItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => ({ length: ITEM_HEIGHT + 24, offset: (ITEM_HEIGHT + 24) * index, index })}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    width: '100%',
    height: ITEM_HEIGHT,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  mediaWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  mediaImage: {
    flex: 1,
    width: undefined,
    height: undefined,
    alignSelf: 'stretch',
  },
  menuButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  indexBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
