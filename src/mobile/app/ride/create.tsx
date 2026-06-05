import React, { useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { RouteServiceToken } from '@/services/routeService';
import type { RouteService } from '@/services/routeService';
import Route from '@/models/route';
import { saveFileToLocalUri } from '@/services/fileStorage';

export default function RouteCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const routeService = useMemo(() => container.resolve<RouteService>(RouteServiceToken), []);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [type, setType] = useState('');
  const [createdByName, setCreatedByName] = useState('');
  const [gpxUri, setGpxUri] = useState('');
  const [gpxFileName, setGpxFileName] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<'name' | 'description' | 'distance' | 'duration' | 'type' | 'createdByName' | 'gpxUri', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getGpxExtension(uri: string, name?: string) {
    const extract = (value: string | undefined) => {
      if (!value) return '';
      const match = value.match(/\.[^/.?]+(?=$|\?)/);
      return match ? match[0].toLowerCase() : '';
    };

    return extract(uri) || extract(name);
  }

  const pickGpx = async () => {
    const result = (await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })) as any;
    if (result.type !== 'success' || !result.uri) {
      return;
    }

    const extension = getGpxExtension(result.uri, result.name);
    if (extension !== '.gpx') {
      setFormErrors((prev) => ({ ...prev, gpxUri: 'GPX file must have a .gpx extension.' }));
      return;
    }

    const savedUri = await saveFileToLocalUri(result.uri);
    setGpxFileName(result.name || savedUri.split('/').pop() || 'GPX file');
    setGpxUri(savedUri || result.uri);
    setFormErrors((prev) => ({ ...prev, gpxUri: undefined }));
  };

  const validateForm = () => {
    const nextErrors: typeof formErrors = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!description.trim()) nextErrors.description = 'Description is required.';
    if (!distance.trim()) nextErrors.distance = 'Distance is required.';
    if (!duration.trim()) nextErrors.duration = 'Duration is required.';
    if (!type.trim()) nextErrors.type = 'Type is required.';
    if (!createdByName.trim()) nextErrors.createdByName = 'Created By is required.';
    if (!gpxUri.trim() && !gpxFileName.trim()) nextErrors.gpxUri = 'GPX file is required.';

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateRoute = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await routeService.createRoute({
        name: name.trim(),
        description: description.trim(),
        distance: distance.trim(),
        duration: duration.trim(),
        type: type.trim(),
        createdByName: createdByName.trim(),
        gpxUrl: gpxUri,
      } as Route);
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { backgroundColor: colors.card }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t.Title.uploadRoute}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.routeName}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: formErrors.name ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder={t.Title.routeName}
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.description}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: formErrors.description ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text, minHeight: 100, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder={t.Title.description}
            placeholderTextColor={colors.secondaryText}
            multiline
          />
        </View>
        <View style={styles.splitRow}>
          <View style={styles.splitItem}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.distance}</Text>
            <TextInput
              style={[styles.textInput, { borderColor: formErrors.distance ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={distance}
              onChangeText={(text) => {
                setDistance(text);
                if (formErrors.distance) setFormErrors((prev) => ({ ...prev, distance: undefined }));
              }}
              placeholder={t.Title.distance}
              placeholderTextColor={colors.secondaryText}
            />
          </View>
          <View style={styles.splitItem}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.duration}</Text>
            <TextInput
              style={[styles.textInput, { borderColor: formErrors.duration ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={duration}
              onChangeText={(text) => {
                setDuration(text);
                if (formErrors.duration) setFormErrors((prev) => ({ ...prev, duration: undefined }));
              }}
              placeholder={t.Title.duration}
              placeholderTextColor={colors.secondaryText}
            />
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.type}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: formErrors.type ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={type}
            onChangeText={(text) => {
              setType(text);
              if (formErrors.type) setFormErrors((prev) => ({ ...prev, type: undefined }));
            }}
            placeholder={t.Title.type}
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.createdBy}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: formErrors.createdByName ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={createdByName}
            onChangeText={(text) => {
              setCreatedByName(text);
              if (formErrors.createdByName) setFormErrors((prev) => ({ ...prev, createdByName: undefined }));
            }}
            placeholder={t.Title.createdBy}
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.gpxFile}</Text>
          <TouchableOpacity style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={pickGpx} activeOpacity={0.8}>
            <Text style={[styles.uploadText, { color: colors.text }]}>{gpxUri ? t.Title.changeGpx : t.Title.selectGpx}</Text>
            <MaterialIcons name="upload-file" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          <Text style={[styles.fileName, { color: colors.secondaryText }]} numberOfLines={1}>{gpxFileName || (gpxUri ? gpxUri.split('/').pop() : t.Title.noFileSelected)}</Text>
          {formErrors.gpxUri ? <Text style={styles.errorText}>{formErrors.gpxUri}</Text> : null}
        </View>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.accent }]}
          onPress={handleCreateRoute}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          <Text style={styles.submitText}>{t.Title.submitRoute}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 8 },
  title: { fontSize: 22, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerAction: { paddingHorizontal: 10, paddingVertical: 8 },
  headerActionText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  content: { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, color: '#666666' },
  textInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15 },
  splitRow: { flexDirection: 'row', gap: 12 },
  splitItem: { flex: 1 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  uploadText: { fontSize: 15, fontWeight: '600' },
  fileName: { marginTop: 8, fontSize: 13 },
  errorText: { marginTop: 6, fontSize: 13, color: '#E85D04' },
  submitButton: { marginTop: 18, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
