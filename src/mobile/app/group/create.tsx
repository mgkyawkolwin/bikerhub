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
  Text
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import SnackBar from '@/components/snackbar';
import { container } from '@/services';
import { GroupServiceToken } from '@/services/groupService';
import type { GroupService } from '@/services/groupService';
import type Group from '@/models/group';

export default function GroupCreateScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const groupService = useMemo(() => container.resolve<GroupService>(GroupServiceToken), []);

  const { colors } = useThemeContext();

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
      mediaTypes: ['images', 'videos'],
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
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <StatusBar style="light" backgroundColor={colors.background} />
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Group</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Group Title</Text>
          <TextInput
            style={[styles.textInput, { borderColor: errors.title ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="Enter group title"
            placeholderTextColor={colors.placeholder}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { borderColor: errors.description ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="Describe your group"
            placeholderTextColor={colors.placeholder}
            multiline
          />
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
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
                <MaterialIcons name="photo" size={20} color={colors.secondaryText} />
                <Text style={[styles.imagePickerText, { color: colors.secondaryText }]}>Logo</Text>
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
                <MaterialIcons name="image" size={20} color={colors.secondaryText} />
                <Text style={[styles.imagePickerText, { color: colors.secondaryText }]}>Cover</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Private Group</Text>
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
          <Text style={[styles.submitText, { color: colors.white }]}>{isSubmitting ? 'Creating...' : 'Create Group'}</Text>
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
