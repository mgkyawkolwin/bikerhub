import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '@/mobile/i18n';
import { useThemeContext } from '@/mobile/hooks/use-theme-context';
import { ThemedText } from '@/mobile/components/themedText';
import { container } from '@/services';
import { BlogServiceToken } from '@/services/blogService';
import type { BlogService } from '@/services/blogService';
import type Blog from '@/models/blog';

export default function BlogCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const blogService = useMemo(() => container.resolve<BlogService>(BlogServiceToken), []);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#F7F7F7',
      card: isDark ? '#121212' : '#FFFFFF',
      border: isDark ? '#232323' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to your photo library to upload a cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing fields', 'Please add a title and content before saving.');
      return;
    }

    setSaving(true);
    try {
      await blogService.createBlog({
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUri ?? undefined,
        author: 'You',
        dateTimeUTC: new Date().toISOString(),
        summary: content.trim().slice(0, 140),
      } as Blog);
      router.push('/blog');
    } catch (error) {
      Alert.alert('Save failed', 'Unable to save the blog. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Create Blog</ThemedText>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={[styles.uploadCard, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.uploadImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <MaterialIcons name="cloud-upload" size={28} color={colors.secondary} />
                <ThemedText style={[styles.uploadText, { color: colors.secondary }]}>Upload Cover Image</ThemedText>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.fieldLabel, { color: colors.primary }]}>Title</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter blog title"
              placeholderTextColor={colors.secondary}
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.primary }]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.fieldLabel, { color: colors.primary }]}>Content</ThemedText>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write your story..."
              placeholderTextColor={colors.secondary}
              multiline
              textAlignVertical="top"
              style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.card, color: colors.primary }]}
            />
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 16, gap: 16 },
  uploadCard: { width: '100%', minHeight: 180, borderRadius: 14, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  uploadImage: { width: '100%', minHeight: 180, aspectRatio: 16 / 9 },
  uploadPlaceholder: { width: '100%', minHeight: 180, justifyContent: 'center', alignItems: 'center', gap: 8 },
  uploadText: { fontSize: 15, fontWeight: '600' },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  input: { width: '100%', minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  textArea: { width: '100%', minHeight: 180, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, lineHeight: 22 },
  saveButton: { marginTop: 16, paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
