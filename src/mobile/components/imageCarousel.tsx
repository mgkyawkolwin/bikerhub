import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, LayoutChangeEvent, PanResponder } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useThemeContext } from '@/hooks/use-theme-context';

function VideoPreview({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />;
}

function isVideoUrl(url?: string) {
  return Boolean(url && /\.(mp4|mov|m4v|webm|mkv)$/i.test(url));
}

type ImageCarouselProps = {
  images: string[];
  imageHeight?: number;
  onImagePress?: (index: number) => void;
};

export default function ImageCarousel({ images, imageHeight = 260, onImagePress }: ImageCarouselProps) {
  const { colors } = useThemeContext();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const gestureStartX = useRef<number | null>(null);

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(Math.max(0, images.length - 1));
    }
  }, [images.length, activeIndex]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setContainerWidth(width);
  };

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < images.length - 1;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => images.length > 1,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 4,
        onPanResponderGrant: (_, gestureState) => {
          gestureStartX.current = gestureState.x0;
        },
        onPanResponderRelease: (_, gestureState) => {
          const dx = gestureState.dx;
          const dy = gestureState.dy;
          const threshold = 50;

          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
            if (dx < 0 && canGoNext) {
              setActiveIndex((prev) => prev + 1);
            } else if (dx > 0 && canGoPrev) {
              setActiveIndex((prev) => prev - 1);
            }
          }

          gestureStartX.current = null;
        },
      }),
    [canGoNext, canGoPrev, images.length],
  );

  const currentImage = images[activeIndex];

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <View
        style={[styles.imageWrapper, { height: imageHeight, backgroundColor: colors.border }]}
        {...panResponder.panHandlers}
      >
        {currentImage ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onImagePress?.(activeIndex)}
            disabled={!onImagePress}
          >
            {isVideoUrl(currentImage) ? (
              <VideoPreview
                uri={currentImage}
                style={[styles.image, { width: containerWidth, height: imageHeight }]}
              />
            ) : (
              <Image
                source={{ uri: currentImage }}
                style={[styles.image, { width: containerWidth, height: imageHeight }]}
              />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {images.length > 1 && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.navButton, !canGoPrev && styles.navDisabled]}
            onPress={() => canGoPrev && setActiveIndex((prev) => prev - 1)}
            disabled={!canGoPrev}
          >
            <MaterialIcons name="chevron-left" size={28} color={canGoPrev ? colors.text : colors.secondaryText} />
          </TouchableOpacity>

          <View style={styles.dotRow}>
            {images.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  index === activeIndex
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.border },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.navButton, !canGoNext && styles.navDisabled]}
            onPress={() => canGoNext && setActiveIndex((prev) => prev + 1)}
            disabled={!canGoNext}
          >
            <MaterialIcons name="chevron-right" size={28} color={canGoNext ? colors.text : colors.secondaryText} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  controls: {
    marginTop: 2,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: {
    opacity: 0.3,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
