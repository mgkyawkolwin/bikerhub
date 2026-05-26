import React, { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '@/mobile/i18n';
import { useThemeColor } from '@/mobile/hooks/use-theme-color';
import { ThemedText } from '@/mobile/components/themedText';
import SnackBar from '@/mobile/components/snackbar';
import { container } from '@/services';
import { GroupServiceToken } from '@/services/groupService';
import type { GroupService } from '@/services/groupService';
import type Group from '@/models/group';

export default function GroupCreateScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const groupService = useMemo(() => container.resolve<GroupService>(GroupServiceToken), []);

  const background = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'text');
  const secondary = useThemeColor({}, 'secondaryText');
  const accent = useThemeColor({}, 'accent');
  const placeholder = useThemeColor({}, 'placeholder');
  const button = useThemeColor({}, 'button');
  const buttonText = useThemeColor({}, 'buttonText');

  const colors = {
    root: background,
    card,
    border,
    primary,
    secondary,
    accent,
    placeholder,
    button,
    buttonText,
    black: '#000000',
    white: '#FFFFFF',
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'title' | 'description', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const nextErrors: typeof errors = {};

    if (!title.trim()) nextErrors.title = 'Group title is required.';
    if (!description.trim()) nextErrors.description = 'Description is required.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      SnackBar.Error('Please fill in the required fields.');
      return false;
    }

    return true;
  };

  const pickImage = async (setter: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Gallery permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      if (uri) setter(uri);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const group: Group = {
        id: `group-${Date.now()}`,
        title: title.trim(),
        icon: 'groups',
        description: description.trim(),
        logoUrl: logoUrl || undefined,
        coverPhotoUrl: coverPhotoUrl || undefined,
        isPrivate,
      };

      await groupService.createGroup(group);
      SnackBar.Success('Group created successfully.');
      router.replace('/group/explore');
    } catch (error) {
      SnackBar.Error('Unable to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.root, paddingTop: insets.top }]}> 
      <StatusBar style="light" backgroundColor={colors.root} />
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.root }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Create Group</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: colors.secondary }]}>Group Title</ThemedText>
          <TextInput
            style={[styles.textInput, { borderColor: errors.title ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.primary }]}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="Enter group title"
            placeholderTextColor={colors.placeholder}
          />
          {errors.title ? <ThemedText style={styles.errorText}>{errors.title}</ThemedText> : null}
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: colors.secondary }]}>Description</ThemedText>
          <TextInput
            style={[styles.textArea, { borderColor: errors.description ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.primary }]}
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="Describe your group"
            placeholderTextColor={colors.placeholder}
            multiline
          />
          {errors.description ? <ThemedText style={styles.errorText}>{errors.description}</ThemedText> : null}
        </View>

        <View style={styles.imageRow}>
          <TouchableOpacity
            style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => void pickImage(setLogoUrl)}
            activeOpacity={0.8}
          >
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.imagePreview} />
            ) : (
              <>
                <MaterialIcons name="photo" size={20} color={colors.secondary} />
                <ThemedText style={[styles.imagePickerText, { color: colors.secondary }]}>Logo</ThemedText>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => void pickImage(setCoverPhotoUrl)}
            activeOpacity={0.8}
          >
            {coverPhotoUrl ? (
              <Image source={{ uri: coverPhotoUrl }} style={styles.imagePreview} />
            ) : (
              <>
                <MaterialIcons name="image" size={20} color={colors.secondary} />
                <ThemedText style={[styles.imagePickerText, { color: colors.secondary }]}>Cover</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <ThemedText style={[styles.fieldLabel, { color: colors.secondary }]}>Private Group</ThemedText>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            thumbColor={isPrivate ? colors.accent : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.accent }]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <ThemedText style={[styles.submitText, { color: colors.white }]}>{isSubmitting ? 'Creating...' : 'Create Group'}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 42,
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePicker: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 13,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#E85D04',
    marginTop: 4,
  },
});
