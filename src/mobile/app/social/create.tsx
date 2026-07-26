import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { SocialServiceToken, type SocialServiceClient } from '@/services/socialService';
import SnackBar from '@/components/snackbar';
import Logger from '@/logging/logger';
import { useAuthContext } from '@/hooks/use-auth-context';
import { CreatePostPayload } from '@/models/createPostPayload';
import LoadingOverlay from '@/components/loadingOverlay';

export default function SocialCreateScreen() {
  const ins = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const shareUrl = Array.isArray(params.shareUrl) ? params.shareUrl[0] : params.shareUrl;
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Friends Only'>('Public');
  const [visibilityModalVisible, setVisibilityModalVisible] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFileName = (uri: string) => {
    const parts = uri.split('/');
    return parts[parts.length - 1] ?? `file-${Date.now()}`;
  };

  const getMimeType = (uri: string) => {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'heic':
        return 'image/heic';
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      default:
        return 'application/octet-stream';
    }
  };
  const socialService = useMemo(() => container.resolve<SocialServiceClient>(SocialServiceToken), []);
  const { authUser } = useAuthContext();

  const requestCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission is required.');
      return false;
    }
    return true;
  }, []);

  const requestLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery permission is required.');
      return false;
    }
    return true;
  }, []);

  const handleCameraPress = useCallback(async () => {
    const canOpen = await requestCamera();
    if (!canOpen) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    const imageResult = result as ImagePicker.ImagePickerResult;
    if (!imageResult.canceled && imageResult.assets?.[0]?.uri) {
      setPhotos((prev) => [imageResult.assets[0].uri, ...prev]);
    }
  }, [requestCamera]);

  const handleGalleryPress = useCallback(async () => {
    const canOpen = await requestLibrary();
    if (!canOpen) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      allowsEditing: false,
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    const imageResult = result as ImagePicker.ImagePickerResult;
    if (!imageResult.canceled && Array.isArray(imageResult.assets)) {
      const uris = imageResult.assets.map((asset) => asset.uri).filter(Boolean);
      setPhotos((prev) => [...uris, ...prev]);
    }
  }, [requestLibrary]);

  const openVisibilityModal = useCallback(() => {
    setVisibilityModalVisible(true);
  }, []);

  const selectVisibility = useCallback((choice: 'Public' | 'Friends Only') => {
    setVisibility(choice);
    setVisibilityModalVisible(false);
  }, []);

  const handlePost = useCallback(async () => {
    if (!content.trim() && !shareUrl && photos.length === 0) {
      SnackBar.Error('Please add text, a shared link, or images before posting.');
      return;
    }

    const unifiedContent = [content.trim(), shareUrl].filter(Boolean).join('\n\n');

    setIsSubmitting(true);
    try {
      const payload: CreatePostPayload = {
        createdById: authUser?.id ?? '',
        content: unifiedContent || undefined,
        visibility,
      };

      console.info('Submitting post with payload:', payload);
      const response = await socialService.createPost(payload);
      console.info('Received response:', response);
      const result = await response.json();
      Logger.debug('Create post response XXXXXXXXX:', result);
      console.debug('Create post response:', result);

      if (!response.ok || !result.success) {
        SnackBar.Error(result.message || 'Unable to post. Please try again.');
        return;
      }

      const createdPostId = result.data?.id;
      if (!createdPostId) {
        SnackBar.Error('Unable to determine post ID after creation.');
        return;
      }

      if (photos.length > 0) {
        for (const uri of photos) {
          const uploadResponse = await socialService.uploadPostMedia(createdPostId, {
            uri,
            name: getFileName(uri),
            type: getMimeType(uri),
          });

          if (!uploadResponse.ok) {
            const uploadResult = await uploadResponse.json().catch(() => null);
            throw new Error(uploadResult?.message || 'Media upload failed.');
          }
        }
      }

      SnackBar.Success('Post submitted successfully.');
      router.back();
    } catch (error) {
      SnackBar.Error('Unable to submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [authUser?.id, content, photos, shareUrl, socialService, visibility, router]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: ins.top }]}>
      <LoadingOverlay isLoading={isSubmitting} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={14} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Post</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: colors.accent, opacity: isSubmitting ? 0.6 : 1 }]}
            activeOpacity={0.85}
            onPress={handlePost}
            disabled={isSubmitting}
          >
            <Text style={styles.postButtonText}>{isSubmitting ? 'Posting...' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: ins.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={openVisibilityModal}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownValueRow}>
              <Text style={[styles.dropdownValue, { color: colors.secondaryText }]}>{visibility}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.secondaryText} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]} activeOpacity={0.8} onPress={handleCameraPress}>
            <MaterialIcons name="photo-camera" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]} activeOpacity={0.8} onPress={handleGalleryPress}>
            <MaterialIcons name="photo-library" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="Write your post..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={6}
          value={content}
          onChangeText={setContent}
        />

        {shareUrl ? (
          <View style={[styles.sharePreview, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.sharePreviewLabel, { color: colors.secondaryText }]}>Share:</Text>
            <Text style={[styles.sharePreviewUrl, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
              {shareUrl}
            </Text>
          </View>
        ) : null}

        {photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {photos.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photo} />
                <TouchableOpacity style={styles.photoDelete} onPress={() => removePhoto(index)}>
                  <MaterialIcons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={visibilityModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisibilityModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVisibilityModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            {(['Public', 'Friends Only'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.optionRow}
                activeOpacity={0.7}
                onPress={() => selectVisibility(option)}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                {visibility === option ? <MaterialIcons name="check" size={20} color={colors.accent} /> : null}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// format following json
const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12
  },
  headerRight: {
    marginLeft: 'auto'
  },
  postButton: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: '700'
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dropdownValue: {
    fontSize: 14
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    minHeight: 170,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12
  },
  photoWrapper: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative'
  },
  photo: {
    width: '100%',
    height: '100%'

  },
  photoDelete: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sharePreview: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12
  },
  sharePreviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4
  },
  sharePreviewUrl: {
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600'
  },
});
