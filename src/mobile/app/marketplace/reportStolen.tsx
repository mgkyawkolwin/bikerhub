import React, { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import SnackBar from '@/components/snackbar';
import { container } from '@/services';
import { StolenBikeServiceToken } from '@/services/stolenBikeService';
import type { StolenBikeService } from '@/services/stolenBikeService';
import type { BikeType } from '@/models/marketplace';
import type { StolenBikeReport } from '@/models/stolenBikeReport';

const MAKES = ['Yamaha', 'Honda', 'Royal Enfield', 'Kawasaki', 'BMW', 'Suzuki', 'Ducati', 'KTM', 'Triumph'] as const;
const MODELS = ['MT-15', 'CB500X', 'Classic 350', 'Z650', 'R NineT', 'V-Strom 650', 'Monster 797', 'CB300R', '390 Duke', 'Tiger 900'] as const;
const TYPES: BikeType[] = ['Cruiser', 'Sport', 'Standard', 'Adventure', 'Touring', 'Custom'];

type DropdownField = 'make' | 'model' | 'type' | null;

export default function ReportStolenScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const stolenBikeService = useMemo(
    () => container.resolve<StolenBikeService>(StolenBikeServiceToken),
    [],
  );

  const { colors } = useThemeContext();

  const [title, setTitle] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [cc, setCc] = useState('');
  const [price, setPrice] = useState('');
  const [km, setKm] = useState('');
  const [vin, setVin] = useState('');
  const [type, setType] = useState<BikeType | undefined>(undefined);
  const [photos, setPhotos] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<DropdownField>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'title' | 'make' | 'model' | 'year' | 'cc' | 'price' | 'type', string>>>({});

  const dropdownItems = useMemo(
    () => ({
      make: MAKES,
      model: MODELS,
      type: TYPES,
    }),
    [],
  );

  const getDropdownLabel = (field: DropdownField) => {
    if (!field) return t.Title.selectOption;

    if (field === 'type') {
      return type || t.Title.selectOption;
    }

    if (field === 'make') {
      return make || t.Title.selectOption;
    }

    if (field === 'model') {
      return model || t.Title.selectOption;
    }

    return t.Title.selectOption;
  };

  const addPhoto = useCallback((uri: string) => {
    setPhotos((prev) => [uri, ...prev]);
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

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

    if (!title.trim()) nextErrors.title = `${t.Title.bikeTitle} is required.`;
    if (!make) nextErrors.make = `${t.Title.make} is required.`;
    if (!model) nextErrors.model = `${t.Title.model} is required.`;
    if (!modelYear.trim()) nextErrors.year = `${t.Title.modelYear} is required.`;
    if (!cc.trim()) nextErrors.cc = `${t.Title.cc} is required.`;
    if (!price.trim()) nextErrors.price = `${t.Title.price} is required.`;
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
      setPhotos((prev) => [...uris, ...prev]);
    }
  };

  const handlePost = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const report: StolenBikeReport = {
        title: title.trim(),
        make,
        model,
        year: Number(modelYear),
        cc: Number(cc),
        price: Number(price),
        km: km.trim(),
        vin: vin.trim(),
        type,
        location: 'Yangon',
        images: photos,
      };

      await stolenBikeService.createReport(report);
      SnackBar.Success(t.Text.postSuccess);
      setTimeout(() => {
        setTitle('');
        setMake('');
        setModel('');
        setModelYear('');
        setCc('');
        setPrice('');
        setKm('');
        setVin('');
        setType(undefined);
        setPhotos([]);
        setErrors({});
      }, 1000);
    } catch (error) {
      SnackBar.Error('Unable to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.black, paddingTop: insets.top }]}> 
      <StatusBar style="light" backgroundColor={colors.black} />
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.black }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.white }]}>{t.Title.reportStolen}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.body, { backgroundColor: colors.background }]}> 
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.bikeTitle || 'Title'}</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { borderColor: errors.title ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text },
              ]}
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder={t.Title.bikeTitle || 'Title'}
              placeholderTextColor={colors.placeholder}
            />
            {errors.title ? <ThemedText style={styles.errorText}>{errors.title}</ThemedText> : null}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.make}</ThemedText>
            <TouchableOpacity
              style={[
                styles.dropdown,
                { borderColor: errors.make ? '#E85D04' : colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => setActiveDropdown('make')}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.dropdownText, { color: colors.text }]}> 
                {make || t.Title.selectOption}
              </ThemedText>
              <MaterialIcons name="expand-more" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
            {errors.make ? <ThemedText style={styles.errorText}>{errors.make}</ThemedText> : null}
            <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.model}</ThemedText>
            <TouchableOpacity
              style={[
                styles.dropdown,
                { borderColor: errors.model ? '#E85D04' : colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => setActiveDropdown('model')}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.dropdownText, { color: colors.text }]}> 
                {model || t.Title.selectOption}
              </ThemedText>
              <MaterialIcons name="expand-more" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
            {errors.model ? <ThemedText style={styles.errorText}>{errors.model}</ThemedText> : null}
            <View style={styles.fieldHalf}>
              <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.modelYear}</ThemedText>
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
              {errors.year ? <ThemedText style={styles.errorText}>{errors.year}</ThemedText> : null}
            </View>
            <View style={styles.fieldHalf}>
              <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.cc}</ThemedText>
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
              {errors.cc ? <ThemedText style={styles.errorText}>{errors.cc}</ThemedText> : null}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.price}</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { borderColor: errors.price ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text },
              ]}
              value={price}
              onChangeText={(text) => {
                setPrice(text.replace(/[^0-9]/g, ''));
                if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
              }}
              placeholder={t.Title.price}
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
            />
            {errors.price ? <ThemedText style={styles.errorText}>{errors.price}</ThemedText> : null}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.km}</ThemedText>
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
            <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.vin}</ThemedText>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={vin}
              onChangeText={setVin}
              placeholder={t.Title.vin}
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.type}</ThemedText>
            <TouchableOpacity
              style={[
                styles.dropdown,
                { borderColor: errors.type ? '#E85D04' : colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => setActiveDropdown('type')}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.dropdownText, { color: colors.text }]}> 
                {type || t.Title.selectOption}
              </ThemedText>
              <MaterialIcons name="expand-more" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
            {errors.type ? <ThemedText style={styles.errorText}>{errors.type}</ThemedText> : null}
            <View style={styles.photoHeader}>
              <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.photos}</ThemedText>
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={[styles.photoActionButton, { borderColor: colors.border }]}
                  onPress={() => void handleImagePick(true)}
                >
                  <MaterialIcons name="photo-camera" size={20} color={colors.text} />
                  <ThemedText style={[styles.photoActionLabel, { color: colors.text }]}>{t.Title.camera}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoActionButton, { borderColor: colors.border }]}
                  onPress={() => void handleImagePick(false)}
                >
                  <MaterialIcons name="photo-library" size={20} color={colors.text} />
                  <ThemedText style={[styles.photoActionLabel, { color: colors.text }]}>{t.Title.gallery}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {photos.length ? (
              <View style={styles.photoGrid}>
                {photos.map((uri, index) => (
                  <View
                    key={`${uri}-${index}`}
                    style={[
                      styles.photoGridItem,
                      { backgroundColor: colors.card },
                      (index + 1) % 3 === 0 ? { marginRight: 0 } : undefined,
                    ]}
                  >
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(index)} hitSlop={10}>
                      <MaterialIcons name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.photoPlaceholder, { borderColor: colors.border }]}> 
                <ThemedText style={[styles.photoPlaceholderText, { color: colors.secondaryText }]}>{t.Text.noPhotos}</ThemedText>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}> 
          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: colors.button }]}
            onPress={handlePost}
            disabled={isSubmitting}
          >
            <ThemedText style={[styles.postButtonText, { color: colors.buttonText }]}>{t.Title.post}</ThemedText>
          </TouchableOpacity>
        </View>

      </View>

      <Modal visible={Boolean(activeDropdown)} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]} onPress={() => setActiveDropdown(null)} />
        <View style={[styles.sheet, { backgroundColor: colors.sheetBackground, borderTopColor: colors.border }]}> 
          <View style={styles.sheetHeader}>
            <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>{t.Title.selectOption}</ThemedText>
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
                <ThemedText style={[styles.sheetItemText, { color: colors.text }]}>{option}</ThemedText>
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
    marginHorizontal: 16,
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
