import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { SocialPostServiceToken, type SocialPostService, type CreatePostPayload } from '@/services/socialPostService';
import SnackBar from '@/components/snackbar';
import Logger from '@/logging/logger';
import { useAuthContext } from '@/hooks/use-auth-context';

export default function SocialCreateScreen() {
  const ins = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Friends Only'>('Public');
  const [visibilityModalVisible, setVisibilityModalVisible] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socialPostService = useMemo(() => container.resolve<SocialPostService>(SocialPostServiceToken), []);
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
    if (!content.trim() && photos.length === 0) {
      SnackBar.Error('Please add text or images before posting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreatePostPayload = {
        createdById: authUser?.id ?? '', // Replace with actual user ID from auth context
        content: content.trim() || undefined,
        imageUrls: photos.length > 0 ? photos : undefined,
        visibility,
      };

      console.info('Submitting post with payload:', payload);
      const response = await socialPostService.createPost(payload);
      console.info('Received response:', response);
      const result = await response.json();
      Logger.debug('Create post response XXXXXXXXX:', result);
      console.debug('Create post response:', result);

      if (!response.ok || !result.success) {
        SnackBar.Error(result.message || 'Unable to post. Please try again.');
        return;
      }

      SnackBar.Success('Post submitted successfully.');
      router.back();
    } catch (error) {
      SnackBar.Error('Unable to submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, photos, socialPostService, visibility, router]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: ins.top }]}> 
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', marginLeft: 12 },
  headerRight: { marginLeft: 'auto' },
  postButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18 },
  postButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  dropdownValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dropdownValue: { fontSize: 14 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  iconButton: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  textArea: { borderWidth: 1, borderRadius: 20, padding: 16, minHeight: 170, textAlignVertical: 'top', fontSize: 15, backgroundColor: '#FFFFFF' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  photoWrapper: { width: '48%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  photo: { width: '100%', height: '100%' },
  photoDelete: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 24 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CCCCCC', alignSelf: 'center', marginBottom: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#99999920' },
  optionText: { fontSize: 16, fontWeight: '600' },
});
