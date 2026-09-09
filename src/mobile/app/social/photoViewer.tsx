import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useThemeContext } from '@/hooks/use-theme-context';

function VideoMediaViewer({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri || 'https://example.com/placeholder.mp4');
  return (
    <VideoView
      player={player}
      style={style}
      contentFit="contain"
      nativeControls
    />
  );
}

export default function PhotoViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const params = useLocalSearchParams();
  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const title = Array.isArray(params.title) ? params.title[0] : params.title;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title ?? 'Photo'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}> 
        {url ? (
          url.match(/\.(mp4|mov|m4v|webm)$/i) ? (
            <VideoMediaViewer uri={url} style={styles.video} />
          ) : (
            <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
          )
        ) : (
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No photo to display.</Text>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
