import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';

type MediaListProps = {
  media: string[];
  initialIndex?: number;
  onMediaPress?: (uri: string, index: number) => void;
};

const ITEM_HEIGHT = 320;

export default function MediaList({ media, initialIndex = 0, onMediaPress }: MediaListProps) {
  const { colors } = useThemeContext();
  const listRef = useRef<FlatList<string>>(null);

  const parsedMedia = useMemo(() => media ?? [], [media]);

  useEffect(() => {
    if (!listRef.current || initialIndex <= 0 || initialIndex >= parsedMedia.length) {
      return;
    }

    listRef.current.scrollToIndex({ index: initialIndex, animated: false });
  }, [initialIndex, parsedMedia.length]);

  const renderMediaItem = ({ item, index }: { item: string; index: number }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onMediaPress?.(item, index)}
        style={styles.mediaWrapper}
      >
        <Image
          source={{ uri: item }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuButton, { backgroundColor: colors.card + 'CC' }]}> 
        <MaterialIcons name="more-vert" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      ref={listRef}
      data={parsedMedia}
      keyExtractor={(item, index) => `${item}-${index}`}
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
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  mediaWrapper: {
    flex: 1,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
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
