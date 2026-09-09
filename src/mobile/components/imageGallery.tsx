import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, State } from 'react-native-gesture-handler';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useThemeContext } from '@/hooks/use-theme-context';

function VideoGalleryPlayer({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={style} contentFit="contain" nativeControls />;
}

function isVideoUrl(url?: string) {
  return Boolean(url && /\.(mp4|mov|m4v|webm|mkv)$/i.test(url));
}

type ImageGalleryProps = {
  visible: boolean;
  images: string[];
  startIndex?: number;
  onClose: () => void;
};

export default function ImageGallery({ visible, images, startIndex = 0, onClose }: ImageGalleryProps) {
  const { colors } = useThemeContext();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScaleValue, setZoomScaleValue] = useState(1);
  const pinchScale = useRef(new Animated.Value(1)).current;
  const baseScale = useRef(new Animated.Value(1)).current;
  const scale = useMemo(() => Animated.multiply(baseScale, pinchScale), [baseScale, pinchScale]);
  const gestureStartX = useRef<number | null>(null);
  const originalOrientation = useRef<ScreenOrientation.OrientationLock | null>(null);

  const dimensions = useWindowDimensions();

  useEffect(() => {
    setCurrentIndex(startIndex);
    setIsFullscreen(false);
    setZoomScaleValue(1);
    baseScale.setValue(1);
    pinchScale.setValue(1);
  }, [startIndex, visible, baseScale, pinchScale]);

  // Handle orientation changes
  useEffect(() => {
    let mounted = true;

    const setupGalleryOrientation = async () => {
      if (!visible) return;
      
      try {
        // Save the current orientation lock
        const currentOrientation = await ScreenOrientation.getOrientationLockAsync();
        originalOrientation.current = currentOrientation;
        
        // Unlock to allow rotation ONLY for the gallery
        await ScreenOrientation.unlockAsync();
      } catch (error) {
        console.warn('Failed to unlock orientation:', error);
      }
    };

    const restoreAppOrientation = async () => {
      if (!mounted) return;
      
      try {
        // Restore the original orientation lock when gallery closes
        if (originalOrientation.current !== null) {
          await ScreenOrientation.lockAsync(originalOrientation.current);
        } else {
          // If we couldn't save the original, lock to portrait as default
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch (error) {
        console.warn('Failed to restore orientation:', error);
      }
    };

    if (visible) {
      setupGalleryOrientation();
    } else {
      // If gallery is closed, restore orientation
      restoreAppOrientation();
    }

    return () => {
      mounted = false;
      // Cleanup: restore orientation when component unmounts
      if (!visible) {
        restoreAppOrientation();
      }
    };
  }, [visible]);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    {
      useNativeDriver: false,
    },
  );

  const getAnimatedValue = (value: Animated.Value) => {
    return (value as Animated.Value & { __getValue: () => number }).__getValue();
  };

  const onPinchHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END || nativeEvent.state === State.CANCELLED) {
      const nextScale = Math.max(1, Math.min(getAnimatedValue(baseScale) * nativeEvent.scale, 4));
      baseScale.setValue(nextScale);
      pinchScale.setValue(1);
      setZoomScaleValue(nextScale);
    }
  };

  const currentImage = images[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < images.length - 1;

  const resetZoom = useCallback(() => {
    baseScale.setValue(1);
    pinchScale.setValue(1);
    setZoomScaleValue(1);
  }, [baseScale, pinchScale]);

  const goPrev = useCallback(() => {
    if (canGoPrev) {
      setCurrentIndex((value) => value - 1);
      resetZoom();
    }
  }, [canGoPrev, resetZoom]);

  const goNext = useCallback(() => {
    if (canGoNext) {
      setCurrentIndex((value) => value + 1);
      resetZoom();
    }
  }, [canGoNext, resetZoom]);

  const toggleFullscreen = useCallback(() => {
    if (images.length === 0) return;
    setIsFullscreen((value) => !value);
  }, [images.length]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => zoomScaleValue <= 1 && images.length > 1,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          zoomScaleValue <= 1 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10,
        onPanResponderGrant: (_, gestureState) => {
          gestureStartX.current = gestureState.x0;
        },
        onPanResponderRelease: (_, gestureState) => {
          const dx = gestureState.dx;
          const threshold = 60;

          if (Math.abs(dx) > threshold) {
            if (dx < 0 && canGoNext) {
              goNext();
            } else if (dx > 0 && canGoPrev) {
              goPrev();
            }
          }

          gestureStartX.current = null;
        },
      }),
    [canGoNext, canGoPrev, goNext, goPrev, images.length, zoomScaleValue],
  );

  const handleClose = useCallback(() => {
    // Restore orientation before closing
    const restoreOrientation = async () => {
      try {
        if (originalOrientation.current !== null) {
          await ScreenOrientation.lockAsync(originalOrientation.current);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch (error) {
        console.warn('Failed to restore orientation on close:', error);
      }
    };
    
    restoreOrientation();
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      supportedOrientations={[
        'portrait',
        'portrait-upside-down',
        'landscape',
        'landscape-left',
        'landscape-right',
      ]}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={[styles.modalRoot, { backgroundColor: colors.black }]}>
          {!isFullscreen && (
            <View style={styles.topBar}>
              <TouchableOpacity onPress={handleClose} hitSlop={14} style={styles.topBarButton}>
                <MaterialIcons name="close" size={26} color={colors.white} />
              </TouchableOpacity>
              <Text style={[styles.counterText, { color: colors.white }]}> {`${currentIndex + 1} / ${images.length}`} </Text>
              <View style={styles.topBarButton} />
            </View>
          )}

          <View style={styles.content}>
            <PinchGestureHandler
              onGestureEvent={onPinchGestureEvent}
              onHandlerStateChange={onPinchHandlerStateChange}
            >
              <Animated.View style={styles.imageContainer} {...panResponder.panHandlers}>
                {currentImage ? (
                  <TouchableWithoutFeedback onPress={toggleFullscreen}>
                    <Animated.View style={styles.imageFrame}>
                      {isVideoUrl(currentImage) ? (
                        <VideoGalleryPlayer
                          uri={currentImage}
                          style={{
                            width: dimensions.width,
                            height: dimensions.height,
                            transform: [{ scale }],
                          }}
                        />
                      ) : (
                        <Animated.Image
                          source={{ uri: currentImage }}
                          style={[
                            styles.image,
                            {
                              width: dimensions.width,
                              height: dimensions.height,
                              transform: [{ scale }],
                            },
                          ]}
                          resizeMode="contain"
                        />
                      )}
                    </Animated.View>
                  </TouchableWithoutFeedback>
                ) : (
                  <Text style={[styles.emptyText, { color: colors.white }]}>No image available</Text>
                )}
              </Animated.View>
            </PinchGestureHandler>

            {!isFullscreen && images.length > 1 && (
              <View style={[styles.footer, { width: dimensions.width }]}>
                <TouchableOpacity
                  style={[styles.navControl, !canGoPrev && styles.navControlDisabled]}
                  disabled={!canGoPrev}
                  onPress={goPrev}
                >
                  <MaterialIcons name="chevron-left" size={34} color={canGoPrev ? colors.white : colors.secondaryText} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navControl, !canGoNext && styles.navControlDisabled]}
                  disabled={!canGoNext}
                  onPress={goNext}
                >
                  <MaterialIcons name="chevron-right" size={34} color={canGoNext ? colors.white : colors.secondaryText} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  topBarButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  imageFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  navControl: {
    borderRadius: 28,
    padding: 8,
  },
  navControlDisabled: {
    opacity: 0.35,
  },
});