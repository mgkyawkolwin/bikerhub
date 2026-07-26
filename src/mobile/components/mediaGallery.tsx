import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useThemeContext } from '@/hooks/use-theme-context';
import PopupMenu from '@/components/popupMenu';
import SnackBar from './snackbar';

type GalleryMediaItem = {
    id?: string;
    url?: string;
    contentType?: string;
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
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
    const [activeItem, setActiveItem] = useState<GalleryMediaItem | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showFullscreenHeader, setShowFullscreenHeader] = useState(false);
    const originalOrientation = useRef<ScreenOrientation.OrientationLock | null>(null);
    const suppressTapRef = useRef(false);
    const gestureStartRef = useRef<{ x: number; y: number } | null>(null);
    const thumbnailScrollRef = useRef<ScrollView | null>(null);

    useEffect(() => {
        if (selectedIndex === null) {
            return;
        }

        if (selectedIndex >= medias.length) {
            setSelectedIndex(Math.max(0, medias.length - 1));
        }
    }, [medias.length, selectedIndex]);

    useEffect(() => {
        if (selectedIndex === null) {
            return;
        }

        if (selectedIndex < 0 || selectedIndex >= medias.length) {
            setSelectedIndex(Math.max(0, medias.length - 1));
            return;
        }

        const currentMedia = medias[selectedIndex];
        if (currentMedia) {
            setActiveItem(currentMedia);
            setActiveIndex(selectedIndex);
        }
    }, [medias, selectedIndex]);

    useEffect(() => {
        if (selectedIndex === null || medias.length <= 1 || !thumbnailScrollRef.current) {
            return;
        }

        const targetX = Math.max(0, (selectedIndex || 0) * 72 - 24);
        thumbnailScrollRef.current.scrollTo({ x: targetX, y: 0, animated: true });
    }, [selectedIndex, medias.length]);

    useEffect(() => {
        let isMounted = true;

        const unlockForFullscreen = async () => {
            if (!fullscreenVisible) {
                return;
            }

            try {
                const currentOrientation = await ScreenOrientation.getOrientationLockAsync();
                originalOrientation.current = currentOrientation;
                await ScreenOrientation.unlockAsync();
            } catch (error) {
                console.warn('Failed to unlock orientation for fullscreen gallery:', error);
            }
        };

        const restoreOrientation = async () => {
            if (!isMounted) {
                return;
            }

            try {
                if (originalOrientation.current !== null) {
                    await ScreenOrientation.lockAsync(originalOrientation.current);
                } else {
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                }
            } catch (error) {
                console.warn('Failed to restore orientation after fullscreen gallery:', error);
            }
        };

        if (fullscreenVisible) {
            unlockForFullscreen();
        } else {
            restoreOrientation();
        }

        return () => {
            isMounted = false;
            if (!fullscreenVisible) {
                restoreOrientation();
            }
        };
    }, [fullscreenVisible]);

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

    const openFullscreen = useCallback((index?: number) => {
        if (!medias.length) {
            return;
        }

        const targetIndex = Math.max(0, Math.min(index ?? selectedIndex ?? 0, medias.length - 1));
        setActiveItem(medias[targetIndex] ?? null);
        setActiveIndex(targetIndex);
        setSelectedIndex(targetIndex);
        setFullscreenVisible(true);
    }, [medias, selectedIndex]);

    const toggleFullscreen = useCallback(() => {
        if (suppressTapRef.current) {
            suppressTapRef.current = false;
            return;
        }

        if (fullscreenVisible) {
            closeFullscreen();
            return;
        }

        setShowFullscreenHeader(false);
        openFullscreen(selectedIndex ?? 0);
    }, [fullscreenVisible, openFullscreen, selectedIndex]);

    const imagePanResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (_, gestureState) => {
                    const dx = gestureState.dx;
                    const dy = gestureState.dy;
                    return Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.15;
                },
                onPanResponderGrant: (_, gestureState) => {
                    gestureStartRef.current = { x: gestureState.x0, y: gestureState.y0 };
                    suppressTapRef.current = false;
                },
                onPanResponderMove: (_, gestureState) => {
                    const dx = gestureState.dx;
                    const dy = gestureState.dy;
                    if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.15) {
                        suppressTapRef.current = true;
                    }
                },
                onPanResponderRelease: (_, gestureState) => {
                    gestureStartRef.current = null;

                    if (selectedIndex === null || medias.length <= 1) {
                        suppressTapRef.current = false;
                        toggleFullscreen();
                        return;
                    }

                    const dx = gestureState.dx;
                    const dy = gestureState.dy;
                    const horizontalDistance = Math.abs(dx);
                    const verticalDistance = Math.abs(dy);
                    const shouldHandleSwipe = suppressTapRef.current || (horizontalDistance > 70 && horizontalDistance > verticalDistance * 1.15);

                    if (shouldHandleSwipe) {
                        if (dx < -70) {
                            setSelectedIndex((current) => (current === null ? 0 : Math.min(current + 1, medias.length - 1)));
                        } else if (dx > 70) {
                            setSelectedIndex((current) => (current === null ? 0 : Math.max(current - 1, 0)));
                        }
                    } else {
                        toggleFullscreen();
                    }

                    suppressTapRef.current = false;
                },
            }),
        [medias.length, selectedIndex, toggleFullscreen],
    );

    const closeViewer = () => {
        setSelectedIndex(null);
        setFullscreenVisible(false);
        setMenuVisible(false);
    };

    const closeSheet = () => {
        setSheetVisible(false);
        setMenuVisible(false);
    };

    const closeFullscreen = () => {
        setFullscreenVisible(false);
        setShowFullscreenHeader(false);
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
                SnackBar.Error('Permission needed to save images.');
                closeMenu();
                return;
            }

            const isLocalFile = activeItem.url.startsWith('file://');
            const fileName = (activeItem.url.split('/').pop() || 'image.jpg').split('?')[0];

            if (!isLocalFile) {
                const destinationFile = new File(Paths.document, fileName);
                await File.downloadFileAsync(activeItem.url, destinationFile);
                await MediaLibrary.saveToLibraryAsync(destinationFile.uri);
            } else {
                await MediaLibrary.saveToLibraryAsync(activeItem.url);
            }

            SnackBar.Success('Image saved to gallery.');
        } catch (error) {
            console.error('Failed to save media', error);
            SnackBar.Error('Failed to save image.');
        } finally {
            closeMenu();
        }
    };

    if (!medias.length) {
        return (
            <View style={[styles.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialIcons name="photo-library" size={28} color={colors.secondaryText} />
                <Text style={[styles.placeholderText, { color: colors.secondaryText }]}>No media available</Text>
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
                                {/* <TouchableOpacity
                                    style={[styles.menuButton, { backgroundColor: colors.card + 'CC' }]}
                                    onPress={() => openMenu(item, index)}
                                    hitSlop={12}
                                >
                                    <MaterialIcons name="more-vert" size={18} color={colors.text} />
                                </TouchableOpacity> */}
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
                <SafeAreaView style={styles.sheetBackdrop}>
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
                </SafeAreaView>
            </Modal>

            <Modal visible={selectedIndex !== null} transparent animationType="fade" onRequestClose={closeViewer}>
                <SafeAreaView style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={closeViewer} hitSlop={12}>
                                <MaterialIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => openMenu(activeItem ?? medias[selectedIndex ?? 0], selectedIndex ?? 0)} hitSlop={12}>
                                <MaterialIcons name="more-vert" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View
                            style={styles.viewerContainer}
                            {...imagePanResponder.panHandlers}
                        >
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
                                <ScrollView
                                    ref={thumbnailScrollRef}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.thumbnailStrip}
                                >
                                    {medias.map((item, index) => (
                                        <TouchableOpacity
                                            key={`${item.id ?? item.url ?? index}-thumb`}
                                            onPress={() => setSelectedIndex(index)}
                                            style={[
                                                styles.thumbnail,
                                                index === selectedIndex ? styles.thumbnailActive : null,
                                                { borderColor: index === selectedIndex ? colors.accent : colors.border },
                                            ]}
                                        >
                                            <Image source={{ uri: item.url }} style={[styles.thumbnailImage]} resizeMode="cover" />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : null}
                    </View>
                </SafeAreaView>
            </Modal>

            <Modal visible={fullscreenVisible} transparent animationType="fade" onRequestClose={closeFullscreen}>
                <SafeAreaView style={styles.fullscreenBackdrop}>
                    <View style={styles.fullscreenContent}>
                        {showFullscreenHeader ? (
                            <View style={styles.fullscreenHeader}>
                                <TouchableOpacity onPress={closeFullscreen} hitSlop={12}>
                                    <MaterialIcons name="close" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => openMenu(activeItem ?? medias[selectedIndex ?? 0], selectedIndex ?? 0)}
                                    hitSlop={12}
                                >
                                    <MaterialIcons name="more-vert" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <View
                            style={styles.fullscreenImageContainer}
                            {...imagePanResponder.panHandlers}
                        >
                            {selectedIndex !== null ? (
                                <Image
                                    source={{ uri: medias[selectedIndex]?.url }}
                                    style={styles.fullscreenImage}
                                    resizeMode="contain"
                                />
                            ) : null}
                        </View>
                    </View>
                </SafeAreaView>
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
        borderRadius: 8,
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
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
        position: 'relative',
    },
    compactCard: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
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
        borderRadius: 8,
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
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 4,
        paddingVertical: 8,
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
        borderRadius: 8,
        overflow: 'hidden',
    },
    sheetImageButton: {
        width: '100%',
    },
    sheetItemImage: {
        width: '100%',
        height: 260,
        borderRadius: 8,
        backgroundColor: '#D9D9D9',
    },
    sheetMenuButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 999,
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
        borderRadius: 8,
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
    fullscreenBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    fullscreenContent: {
        flex: 1,
        paddingTop: 16,
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    fullscreenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    fullscreenImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
});
