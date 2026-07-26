import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useThemeContext } from '@/hooks/use-theme-context';
import PopupMenu from '@/components/popupMenu';

type GalleryMediaItem = {
  id?: string;
  url?: string;
  contentType?: string;
  objectName?: string;
};

type MediaGalleryProps = {
  medias: GalleryMediaItem[];
  canDelete?: boolean;
  onDelete?: (item: GalleryMediaItem, index: number) => Promise<void> | void;
};

// function normalizeMedia(media?: (GalleryMediaItem)[]): GalleryMediaItem[] {
//   if (!media?.length) {
//     return [];
//   }

//   return media
//     .map((item) => {

//       const uri = typeof item.uri === 'string' && item.uri.trim()
//         ? item.uri
//         : typeof item.url === 'string' && item.url.trim()
//           ? item.url
//           : '';

//       return {
//         id: item.id,
//         url: item.url,
//         contentType: item.contentType,
//         objectName: item.objectName,
//       };
//     })
//     .filter((item): item is GalleryMediaItem => Boolean(item?.uri));
// }

export default function MediaGallery({ medias, canDelete = false, onDelete }: MediaGalleryProps) {
  const { colors } = useThemeContext();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeItem, setActiveItem] = useState<GalleryMediaItem | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    if (selectedIndex >= medias.length) {
      setSelectedIndex(Math.max(0, medias.length - 1));
    }
  }, [medias.length, selectedIndex]);

  const openMediaList = (index: number) => {
    if (!medias.length) {
      return;
    }

    setActiveItem(medias[index] ?? null);
    setActiveIndex(index);
    setSheetVisible(true);
  };

  const openViewer = (index: number) => {
    if (!medias.length) {
      return;
    }

    setActiveItem(medias[index] ?? null);
    setActiveIndex(index);
    setSheetVisible(false);
    setSelectedIndex(index);
  };

  const closeViewer = () => {
    setSelectedIndex(null);
    setMenuVisible(false);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setMenuVisible(false);
  };

  const openMenu = (item: GalleryMediaItem, index: number) => {
    setActiveItem(item);
    setActiveIndex(index);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setActiveItem(null);
    setActiveIndex(null);
  };

  const handleDelete = async () => {
    if (!activeItem || activeIndex === null || !onDelete || isDeleting) {
      closeMenu();
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(activeItem, activeIndex);
      closeMenu();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!activeItem?.url) {
      closeMenu();
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save images to your gallery.');
        closeMenu();
        return;
      }

      const isLocalFile = activeItem.url.startsWith('file://');
      const destinationUri = isLocalFile
        ? activeItem.url
        : `${FileSystem.Paths.document.uri}${(activeItem.url.split('/').pop() || 'image.jpg').split('?')[0]}`;

      if (!isLocalFile) {
        const downloadResult = await FileSystem.downloadAsync(activeItem.url, destinationUri);
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      } else {
        await MediaLibrary.saveToLibraryAsync(activeItem.url);
      }

      Alert.alert('Saved', 'The image was saved to your gallery.');
    } catch (error) {
      console.error('Failed to save media', error);
      Alert.alert('Save failed', 'Unable to save this image right now.');
    } finally {
      closeMenu();
    }
  };

  if (!medias.length) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <MaterialIcons name="photo-library" size={28} color={colors.secondaryText} />
        <Text style={[styles.placeholderText, { color: colors.secondaryText }]}>{medias?.length ? `${medias.length} media items` : 'No media available'}</Text>
      </View>
    );
  }

  const renderThumbnail = (item: GalleryMediaItem, index: number, compact = false) => {
    const cardStyle = compact ? styles.compactCard : styles.card;

    return (
      <TouchableOpacity
        key={`${item.id ?? index}`}
        activeOpacity={0.9}
        onPress={() => openMediaList(index)}
        style={[cardStyle, { borderColor: colors.border }]}
      >
        <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: colors.card + 'CC' }]}
          onPress={() => openMenu(item, index)}
          hitSlop={12}
        >
          <MaterialIcons name="more-vert" size={18} color={colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderMainGallery = () => {
    if (medias.length === 1) {
      return (
        <View style={styles.singleWrapper}>
          {renderThumbnail(medias[0], 0, false)}
        </View>
      );
    }

    if (medias.length <= 3) {
      return (
        <View style={styles.rowContainer}>
          {medias.map((item, index) => (
            <View key={`${item.id ?? item.url ?? index}`} style={styles.rowItem}>
              {renderThumbnail(item, index, true)}
            </View>
          ))}
        </View>
      );
    }

    const visibleItems = medias.slice(0, 6);
    const remainingCount = medias.length - visibleItems.length;

    return (
      <View style={styles.gridContainer}>
        {visibleItems.map((item, index) => {
          const isLastItem = index === visibleItems.length - 1 && remainingCount > 0;
          return (
            <View key={`${item.id ?? item.url ?? index}`} style={styles.gridItem}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openMediaList(index)}
                style={[styles.card, { borderColor: colors.border }]}
              >
                <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
                {isLastItem ? (
                  <View style={[styles.overlayBadge, { backgroundColor: colors.card + 'CC' }]}> 
                    <Text style={[styles.overlayBadgeText, { color: colors.text }]}>+{remainingCount}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[styles.menuButton, { backgroundColor: colors.card + 'CC' }]}
                  onPress={() => openMenu(item, index)}
                  hitSlop={12}
                >
                  <MaterialIcons name="more-vert" size={18} color={colors.text} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View>
      {renderMainGallery()}

      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.sheetBackdrop}> 
          <View style={[styles.sheetContent, { backgroundColor: colors.background }]}> 
            <View style={styles.sheetHeader}> 
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Photos</Text>
              <TouchableOpacity onPress={closeSheet} hitSlop={12}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetList} showsVerticalScrollIndicator={false}>
              {medias.map((item, index) => (
                <View key={`${item.id ?? item.url ?? index}`} style={styles.sheetItemCard}>
                  <TouchableOpacity activeOpacity={0.95} onPress={() => openViewer(index)} style={styles.sheetImageButton}>
                    <Image source={{ uri: item.url }} style={styles.sheetItemImage} resizeMode="cover" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sheetMenuButton, { backgroundColor: colors.card + 'CC' }]}
                    onPress={() => openMenu(item, index)}
                    hitSlop={12}
                  >
                    <MaterialIcons name="more-vert" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={selectedIndex !== null} transparent animationType="fade" onRequestClose={closeViewer}>
        <View style={styles.modalBackdrop}> 
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}> 
            <View style={styles.modalHeader}> 
              <TouchableOpacity onPress={closeViewer} hitSlop={12}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openMenu(activeItem ?? medias[selectedIndex ?? 0], selectedIndex ?? 0)} hitSlop={12}>
                <MaterialIcons name="more-vert" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.viewerContainer}>
              {selectedIndex !== null ? (
                <Image
                  source={{ uri: medias[selectedIndex]?.url }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>

            {medias.length > 1 ? (
              <View style={styles.thumbnailStripWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailStrip}>
                  {medias.map((item, index) => (
                    <TouchableOpacity
                      key={`${item.id ?? item.url ?? index}-thumb`}
                      onPress={() => setSelectedIndex(index)}
                      style={[
                        styles.thumbnail,
                        index === selectedIndex ? styles.thumbnailActive : null,
                        { borderColor: index === selectedIndex ? colors.button : colors.border },
                      ]}
                    >
                      <Image source={{ uri: item.url }} style={styles.thumbnailImage} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <PopupMenu
        visible={menuVisible}
        onClose={closeMenu}
        items={[
          { label: 'Save', onPress: handleSave },
          ...(canDelete && onDelete ? [{ label: 'Delete', destructive: true, onPress: handleDelete }] : []),
          { label: 'Cancel', onPress: closeMenu },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  singleWrapper: {
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  rowItem: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '31.5%',
  },
  card: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  compactCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  overlayBadge: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBadgeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 24,
    marginTop: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetList: {
    gap: 12,
    paddingBottom: 8,
  },
  sheetItemCard: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  sheetImageButton: {
    width: '100%',
  },
  sheetItemImage: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    backgroundColor: '#D9D9D9',
  },
  sheetMenuButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerSpacer: {
    width: 24,
  },
  viewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailStripWrapper: {
    marginTop: 12,
  },
  thumbnailStrip: {
    gap: 8,
    paddingBottom: 4,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
