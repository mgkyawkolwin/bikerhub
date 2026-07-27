import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import SnackBar from '@/components/snackbar';
import LoadingOverlay from '@/components/loadingOverlay';
import { container } from '@/services';
import { GarageBikeServiceToken } from '@/services/garageBikeService';
import type { GarageBikeService } from '@/services/garageBikeService';
import type { BikeType } from '@/models/marketplace';
import { GarageBike } from '@/models/garageBike';
import Lookup from '@/models/lookup';
import { LookupService, LookupServiceToken } from '@/services/lookupService';
import AutoCompleteTextInput from '@/components/autoCompleteTextInput';

// const MAKES = ['Yamaha', 'Honda', 'Royal Enfield', 'Kawasaki', 'BMW', 'Suzuki', 'Ducati', 'KTM', 'Triumph'] as const;
// const MODELS = ['MT-15', 'CB500X', 'Classic 350', 'Z650', 'R NineT', 'V-Strom 650', 'Monster 797', 'CB300R', '390 Duke', 'Tiger 900'] as const;
// const TYPES: BikeType[] = ['Cruiser', 'Sport', 'Standard', 'Adventure', 'Touring', 'Custom'];

type DropdownField = 'make' | 'model' | 'type' | null;

type PhotoItem = {
  uri: string;
  id?: string;
  isExisting?: boolean;
};

export default function AddGarageBikeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const garageBikeService = useMemo(
    () => container.resolve<GarageBikeService>(GarageBikeServiceToken),
    [],
  );
  const lookupService = useMemo(
    () => container.resolve<LookupService>(LookupServiceToken),
    [],
  );

  const { colorScheme, colors } = useThemeContext();

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [editingGarageBike, setEditingGarageBike] = useState<GarageBike | null>(null);
  const [modelYear, setModelYear] = useState('');
  const [cc, setCc] = useState('');
  const [km, setKm] = useState('');
  const [vin, setVin] = useState('');
  const [type, setType] = useState<BikeType | undefined>(undefined);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<DropdownField>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'make' | 'model' | 'year' | 'cc' | 'price' | 'type', string>>>({});
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [types, setTypes] = useState<BikeType[]>([]);
  const [makeSuggestionsVisible, setMakeSuggestionsVisible] = useState(false);
  const [modelSuggestionsVisible, setModelSuggestionsVisible] = useState(false);
  const [typeSuggestionsVisible, setTypeSuggestionsVisible] = useState(false);

  const garageBikeId = Array.isArray(params.garageBikeId) ? params.garageBikeId[0] : params.garageBikeId;
  const isEditMode = params.mode === 'edit';

  const loadGarageBikeForEdit = useCallback(async () => {
    if (!isEditMode || !garageBikeId) {
      setEditingGarageBike(null);
      return;
    }

    try {
      const response = await garageBikeService.getGarageBikeById(garageBikeId);
      if (!response.ok) {
        SnackBar.Error(`${response.status}: ${response.statusText}. Request failed. Please try again.`);
        return;
      }

      const responseJson = await response.json();
      console.log('Garage bike fetch response:', responseJson);
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }

      const parsedGarageBike = responseJson.data as GarageBike;
      setEditingGarageBike(parsedGarageBike);
      setMake(parsedGarageBike.make ?? '');
      setModel(parsedGarageBike.model ?? '');
      setModelYear(parsedGarageBike.year?.toString() ?? '');
      setCc(parsedGarageBike.cc ?? '');
      setKm(parsedGarageBike.km ?? '');
      setVin(parsedGarageBike.vin ?? '');
      setType(parsedGarageBike.type);
      setPhotos(
        (parsedGarageBike.images ?? []).map((image) => ({
          uri: image.url ?? '',
          id: image.id,
          isExisting: true,
        })).filter((photo) => Boolean(photo.uri)),
      );
    } catch {
      setEditingGarageBike(null);
    }
  }, [garageBikeId, garageBikeService, isEditMode]);

  useEffect(() => {
    void loadGarageBikeForEdit();
  }, [loadGarageBikeForEdit]);

  useFocusEffect(
    useCallback(() => {
      if (isEditMode && garageBikeId) {
        void loadGarageBikeForEdit();
      }
    }, [garageBikeId, isEditMode, loadGarageBikeForEdit]),
  );

  const dropdownItems = useMemo(
    () => ({
      make: makes,
      model: models,
      type: types,
    }),
    [],
  );

  const removePhoto = useCallback(async (index: number) => {
    const photo = photos[index];
    if (!photo) return;

    if (photo.isExisting && photo.id && editingGarageBike?.id) {
      try {
        const response = await garageBikeService.deleteGarageBikeMedia(editingGarageBike.id, photo.id);
        if (!response.ok) {
          SnackBar.Error('Unable to delete this photo right now.');
          return;
        }

        setEditingGarageBike((prev) => prev ? ({ ...prev, images: (prev.images ?? []).filter((image) => image.id !== photo.id) }) : prev);
        setPhotos((prev) => prev.filter((_, idx) => idx !== index));
        SnackBar.Success('Photo deleted.');
        return;
      } catch {
        SnackBar.Error('Unable to delete this photo right now.');
        return;
      }
    }

    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  }, [editingGarageBike?.id, garageBikeService, photos]);

  const getFileName = (uri: string) => {
    const parts = uri.split('/');
    return parts[parts.length - 1] ?? `image-${Date.now()}`;
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
      default:
        return 'application/octet-stream';
    }
  };

  const requestCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.Title.camera, 'Camera permission is required.');
      return false;
    }
    return true;
  };

  const requestLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.Title.gallery, 'Gallery permission is required.');
      return false;
    }
    return true;
  };

  const validateForm = () => {
    const nextErrors: typeof errors = {};

    if (!make) nextErrors.make = `${t.Title.make} is required.`;
    if (!model) nextErrors.model = `${t.Title.model} is required.`;
    if (!modelYear.trim()) nextErrors.year = `${t.Title.modelYear} is required.`;
    if (!cc.trim()) nextErrors.cc = `${t.Title.cc} is required.`;
    if (!type) nextErrors.type = `${t.Title.type} is required.`;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      SnackBar.Error(t.Text.requiredFields);
      return false;
    }

    return true;
  };

  const handleImagePick = async (fromCamera: boolean) => {
    const canPick = fromCamera ? await requestCamera() : await requestLibrary();
    if (!canPick) return;

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({
        quality: 0.6,
        allowsEditing: false,
        allowsMultipleSelection: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

    const imageResult = result as ImagePicker.ImagePickerResult;
    const assets = Array.isArray(imageResult.assets) ? imageResult.assets : [];
    const uris = assets.map((asset) => asset.uri).filter(Boolean);

    if (!imageResult.canceled && uris.length) {
      setPhotos((prev) => [...uris.map((uri) => ({ uri })), ...prev]);
    }
  };

  const handlePost = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const garageBike: GarageBike = {
        make,
        model,
        year: Number(modelYear),
        cc: cc,
        km: km.trim(),
        vin: vin.trim(),
        type,
      };

      if (isEditMode && editingGarageBike?.id) {
        const response = await garageBikeService.updateGarageBike(editingGarageBike.id, garageBike);
        if (!response.ok) {
          SnackBar.Error(`${response.status}: ${response.statusText}. Request failed. Please try again.`);
          return;
        }

        const pendingUploads = photos.filter((photo) => !photo.isExisting);
        if (pendingUploads.length > 0) {
          for (const photo of pendingUploads) {
            const uploadResponse = await garageBikeService.uploadGarageBikeImage(editingGarageBike.id, {
              uri: photo.uri,
              name: getFileName(photo.uri),
              type: getMimeType(photo.uri),
            });

            if (!uploadResponse.ok) {
              const uploadResult = await uploadResponse.json().catch(() => null);
              throw new Error(uploadResult?.message || 'Media upload failed.');
            }
          }
        }

        SnackBar.Success('Garage bike updated successfully.');
        setTimeout(() => router.back(), 1000);
        return;
      }

      const response = await garageBikeService.createGarageBike(garageBike);
      if (!response.ok) {
        SnackBar.Error(`${response.status}: ${response.statusText}. Request failed. Please try again.`);
        return;
      }

      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }

      const createdListingId = responseJson.data?.id?.toString();
      if (!createdListingId) {
        SnackBar.Error('Unable to determine listing ID after creation.');
        return;
      }

      if (photos.length > 0) {
        for (const photo of photos) {
          if (photo.isExisting) {
            continue;
          }

          const uploadResponse = await garageBikeService.uploadGarageBikeImage(createdListingId, {
            uri: photo.uri,
            name: getFileName(photo.uri),
            type: getMimeType(photo.uri),
          });

          if (!uploadResponse.ok) {
            const uploadResult = await uploadResponse.json().catch(() => null);
            throw new Error(uploadResult?.message || 'Media upload failed.');
          }
        }
      }

      SnackBar.Success(t.Text.postSuccess);
      setTimeout(() => router.back(), 1000);
    } catch {
      SnackBar.Error('Unable to submit listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
    const handleMakeTextChange = async (text: string) => {
      setMake(text);
      const response = await lookupService.getLookup('MAKE', "", text);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again.');
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }
  
      const lookups = responseJson.data as Lookup[];
      setMakes(lookups.map((lookup) => lookup.value));
    }
  
    const handleModelTextChange = async (text: string) => {
      setModel(text);
      const response = await lookupService.getLookup(make, '', text);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again.');
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }
  
      const lookups = responseJson.data as Lookup[];
      setModels(lookups.map((lookup) => lookup.value));
    }
  
    const handleTypeTextChange = async (text: string) => {
      setType(text);
      const response = await lookupService.getLookup('BIKE_TYPE', '', text);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again.');
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }
  
      const lookups = responseJson.data as Lookup[];
      setTypes(lookups.map((lookup) => lookup.value));
    }

  return (
    <View style={[styles.root, { backgroundColor: colors.card, paddingTop: insets.top }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.card} />
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditMode ? 'Edit Bike' : t.Title.garageBike}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.body, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.make}</Text>
            <AutoCompleteTextInput
              value={make}
              onBlur={() => setMakeSuggestionsVisible(false)}
              onTextChange={(text) => {
                handleMakeTextChange(text);
                if (errors.make) setErrors((prev) => ({ ...prev, make: undefined }));
              }}
              isSuggestionsVisible={makeSuggestionsVisible}
              suggestions={makes}
              placeholder={t.Title.make}
              placeholderTextColor={colors.placeholder}
              style={[
                styles.textInput,
                { borderColor: errors.make ? colors.accent : colors.border, backgroundColor: colors.card, color: colors.text },
              ]}
            />
            {errors.make ? <Text style={styles.errorText}>{errors.make}</Text> : null}
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.model}</Text>
            <AutoCompleteTextInput
              value={model}
              onBlur={() => setModelSuggestionsVisible(false)}
              onTextChange={(text) => {
                handleModelTextChange(text);
                if (errors.model) setErrors((prev) => ({ ...prev, model: undefined }));
              }}
              isSuggestionsVisible={modelSuggestionsVisible}
              suggestions={models}
              placeholder={t.Title.model}
              placeholderTextColor={colors.placeholder}
              style={[
                styles.textInput,
                { borderColor: errors.model ? colors.accent : colors.border, backgroundColor: colors.card, color: colors.text },
              ]}
            />
            {errors.model ? <Text style={styles.errorText}>{errors.model}</Text> : null}

            <View style={styles.fieldHalf}>

              <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.type}</Text>
              <AutoCompleteTextInput
              value={type}
              onBlur={() => setTypeSuggestionsVisible(false)}
              onTextChange={(text) => {
                handleTypeTextChange(text);
                if (errors.type) setErrors((prev) => ({ ...prev, type: undefined }));
              }}
              isSuggestionsVisible={typeSuggestionsVisible}
              suggestions={types}
              placeholder={t.Title.type}
              placeholderTextColor={colors.placeholder}
              style={[
                styles.textInput,
                { borderColor: errors.type ? colors.accent : colors.border, backgroundColor: colors.card, color: colors.text },
              ]}
            />
              {errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}
            </View>

            <View style={styles.fieldHalf}>
              <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.modelYear}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { borderColor: errors.year ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text },
                ]}
                value={modelYear}
                onChangeText={(text) => {
                  setModelYear(text.replace(/[^0-9]/g, ''));
                  if (errors.year) setErrors((prev) => ({ ...prev, year: undefined }));
                }}
                placeholder={t.Title.modelYear}
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
              />
              {errors.year ? <Text style={styles.errorText}>{errors.year}</Text> : null}
            </View>

            <View style={styles.fieldHalf}>
              <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.cc}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { borderColor: errors.cc ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text },
                ]}
                value={cc}
                onChangeText={(text) => {
                  setCc(text.replace(/[^0-9]/g, ''));
                  if (errors.cc) setErrors((prev) => ({ ...prev, cc: undefined }));
                }}
                placeholder={t.Title.cc}
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
              />
              {errors.cc ? <Text style={styles.errorText}>{errors.cc}</Text> : null}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.km}</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={km}
              onChangeText={setKm}
              placeholder={t.Title.km}
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.vin}</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={vin}
              onChangeText={setVin}
              placeholder={t.Title.vin}
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.fieldGroup}>

            <View style={styles.photoHeader}>
              <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.photos}</Text>
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={[styles.photoActionButton, { borderColor: colors.border }]}
                  onPress={() => void handleImagePick(true)}
                >
                  <MaterialIcons name="photo-camera" size={20} color={colors.text} />
                  <Text style={[styles.photoActionLabel, { color: colors.text }]}>{t.Title.camera}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoActionButton, { borderColor: colors.border }]}
                  onPress={() => void handleImagePick(false)}
                >
                  <MaterialIcons name="photo-library" size={20} color={colors.text} />
                  <Text style={[styles.photoActionLabel, { color: colors.text }]}>{t.Title.gallery}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {photos.length ? (
              <View style={[styles.photoGrid, photos.length >= 3 ? { justifyContent: 'space-between' } : { justifyContent: 'flex-start' }]}>
                {photos.map((photo, index) => (
                  <View
                    key={`${photo.uri}-${index}`}
                    style={[
                      styles.photoGridItem,
                      { backgroundColor: colors.card },
                      (index + 1) % 3 === 0 ? { marginRight: 0 } : undefined,
                    ]}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => void removePhoto(index)} hitSlop={10}>
                      <MaterialIcons name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.photoPlaceholder, { borderColor: colors.border }]}>
                <Text style={[styles.photoPlaceholderText, { color: colors.secondaryText }]}>{t.Text.noPhotos}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: colors.accent }]}
            onPress={handlePost}
            disabled={isSubmitting}
          >
            <Text style={[styles.postButtonText, { color: colors.buttonText }]}>{isEditMode ? 'Update' : t.Title.post}</Text>
          </TouchableOpacity>
        </View>

      </View>

      <LoadingOverlay isLoading={isSubmitting} />

      <Modal visible={Boolean(activeDropdown)} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]} onPress={() => setActiveDropdown(null)} />
        <View style={[styles.sheet, { backgroundColor: colors.sheetBackground, borderTopColor: colors.border }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{t.Title.selectOption}</Text>
            <TouchableOpacity onPress={() => setActiveDropdown(null)} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetBody}>
            {(activeDropdown ? dropdownItems[activeDropdown] : []).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.sheetItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  if (activeDropdown === 'make') setMake(option as string);
                  if (activeDropdown === 'model') setModel(option as string);
                  if (activeDropdown === 'type') setType(option as BikeType);
                  setActiveDropdown(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetItemText, { color: colors.text }]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  scrollArea: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },
  errorText: {
    color: '#E85D04',
    fontSize: 12,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 14,
  },
  photoSection: {
    gap: 12,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  photoActionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoGridItem: {
    width: '29%',
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    marginRight: 6,
  },
  photoList: {
    minHeight: 120,
  },
  photoListContent: {
    alignItems: 'center',
    gap: 12,
  },
  photoItem: {
    width: 120,
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    width: '100%',
    minHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  photoPlaceholderText: {
    fontSize: 13,
    textAlign: 'center',
  },
  postButton: {
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sheetOverlay: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingTop: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sheetItem: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetItemText: {
    fontSize: 15,
  },
});