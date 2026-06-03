import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { ConfigServiceToken } from '@/services/configService';
import { DirectoryServiceToken } from '@/services/directoryService';
import type { ConfigService } from '@/services/configService';
import type { DirectoryService } from '@/services/directoryService';
import type Directory from '@/models/directory';
import SnackBar from '@/components/snackbar';

type DropdownField = 'businessType' | 'city' | 'stateDivision' | null;

export default function DirectoryCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const configService = useMemo(() => container.resolve<ConfigService>(ConfigServiceToken), []);
  const directoryService = useMemo(() => container.resolve<DirectoryService>(DirectoryServiceToken), []);

  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [stateDivisions, setStateDivisions] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateDivision, setStateDivision] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUri, setLogoUri] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<DropdownField>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'name' | 'businessType' | 'address' | 'city' | 'stateDivision', string>>>({});

  useEffect(() => {
    void (async () => {
      const [types, cityList, states] = await Promise.all([
        configService.getBusinessTypes(),
        configService.getCities(),
        configService.getStateDivisions(),
      ]);
      setBusinessTypes(types);
      setCities(cityList);
      setStateDivisions(states);
    })();
  }, [configService]);

  const dropdownItems = useMemo(
    () => ({
      businessType: businessTypes,
      city: cities,
      stateDivision: stateDivisions,
    }),
    [businessTypes, cities, stateDivisions],
  );

  const getDisplayText = (field: DropdownField) => {
    if (field === 'businessType') return businessType || t.Title.businessType;
    if (field === 'city') return city || t.Title.city;
    if (field === 'stateDivision') return stateDivision || t.Title.stateDivision;
    return t.Title.selectOption;
  };

  const selectOption = (option: string, field: DropdownField) => {
    if (!field) return;
    if (field === 'businessType') setBusinessType(option);
    if (field === 'city') setCity(option);
    if (field === 'stateDivision') setStateDivision(option);
    setActiveDropdown(null);
  };

  const requestLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.Title.gallery, 'Gallery permission is required.');
      return false;
    }
    return true;
  };

  const pickImage = async (setter: (uri: string) => void) => {
    const canPick = await requestLibrary();
    if (!canPick) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    const imageResult = result as ImagePicker.ImagePickerResult;
    const selected = Array.isArray(imageResult.assets) ? imageResult.assets[0] : undefined;
    if (!imageResult.canceled && selected?.uri) {
      setter(selected.uri);
    }
  };

  const validateForm = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = `${t.Title.businessName} is required.`;
    if (!businessType) nextErrors.businessType = `${t.Title.businessType} is required.`;
    if (!address.trim()) nextErrors.address = `${t.Title.address} is required.`;
    if (!city) nextErrors.city = `${t.Title.city} is required.`;
    if (!stateDivision) nextErrors.stateDivision = `${t.Title.stateDivision} is required.`;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      SnackBar.Error(t.Text.requiredFields);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const listing: Directory = {
        name: name.trim(),
        businessType,
        address: address.trim(),
        city,
        state: stateDivision,
        phone: phone.trim(),
        logoUrl: logoUri || undefined,
        coverImageUrl: coverUri || undefined,
        likesCount: 0,
        rating: 0,
        ratingCount: 0,
      };

      await directoryService.createDirectory(listing);
      SnackBar.Success(t.Text.directorySubmitSuccess);
      router.replace('/directory/directory');
    } catch {
      SnackBar.Error('Unable to submit business. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.Title.submitBusiness}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.businessName}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: errors.name ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder={t.Title.businessName}
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.businessType}</Text>
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: errors.businessType ? '#E85D04' : colors.border, backgroundColor: colors.card }]}
            onPress={() => setActiveDropdown('businessType')}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>{getDisplayText('businessType')}</Text>
            <MaterialIcons name="expand-more" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.address}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: errors.address ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
            }}
            placeholder={t.Title.address}
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.city}</Text>
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: errors.city ? '#E85D04' : colors.border, backgroundColor: colors.card }]}
            onPress={() => setActiveDropdown('city')}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>{getDisplayText('city')}</Text>
            <MaterialIcons name="expand-more" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.stateDivision}</Text>
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: errors.stateDivision ? '#E85D04' : colors.border, backgroundColor: colors.card }]}
            onPress={() => setActiveDropdown('stateDivision')}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>{getDisplayText('stateDivision')}</Text>
            <MaterialIcons name="expand-more" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.phone}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder={t.Title.phone}
            placeholderTextColor={colors.secondaryText}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.logoImage}</Text>
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => void pickImage(setLogoUri)}
            activeOpacity={0.8}
          >
            <Text style={[styles.uploadText, { color: colors.text }]}>
              {logoUri ? t.Title.changeImage : t.Title.uploadLogo}
            </Text>
            <MaterialIcons name="photo-library" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          {logoUri ? <Image source={{ uri: logoUri }} style={styles.previewImage} resizeMode="cover" /> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.coverImageUrl}</Text>
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => void pickImage(setCoverUri)}
            activeOpacity={0.8}
          >
            <Text style={[styles.uploadText, { color: colors.text }]}>
              {coverUri ? t.Title.changeImage : t.Title.uploadCover}
            </Text>
            <MaterialIcons name="photo-library" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
          {coverUri ? <Image source={{ uri: coverUri }} style={styles.previewImage} resizeMode="cover" /> : null}
        </View>

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.accent }]} activeOpacity={0.8} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.submitText}>{t.Title.submit}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={Boolean(activeDropdown)} animationType="slide" transparent statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setActiveDropdown(null)}>
          <View style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}> 
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
                onPress={() => activeDropdown && selectOption(option, activeDropdown)}
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
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSpacer: { width: 22 },
  form: { paddingHorizontal: 16, gap: 18, paddingTop: 8 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, color: '#666666' },
  textInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 16 },
  dropdownText: { fontSize: 15 },
  uploadButton: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  uploadText: { fontSize: 15, fontWeight: '600' },
  previewImage: { width: '100%', height: 180, borderRadius: 18, marginTop: 8 },
  submitButton: { marginTop: 16, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  sheetOverlay: { flex: 1 },
  sheet: { maxHeight: '55%', borderTopWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetBody: { paddingHorizontal: 16, paddingBottom: 24 },
  sheetItem: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetItemText: { fontSize: 15 },
});
