import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { DirectoryServiceToken } from '@/services/directoryService';
import { LookupService, LookupServiceToken } from '@/services/lookupService';
import type { ApiResponse } from '@/services/apiClient';
import type { DirectoryService } from '@/services/directoryService';
import type Directory from '@/models/directory';
import type Lookup from '@/models/lookup';
import AutoCompleteTextInput from '@/components/autoCompleteTextInput';
import SnackBar from '@/components/snackbar';

export default function DirectoryCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const lookupService = useMemo(() => container.resolve<LookupService>(LookupServiceToken), []);
  const directoryService = useMemo(() => container.resolve<DirectoryService>(DirectoryServiceToken), []);

  const [businessTypeOptions, setBusinessTypeOptions] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessTypeSuggestionsVisible, setBusinessTypeSuggestionsVisible] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [citySuggestionsVisible, setCitySuggestionsVisible] = useState(false);
  const [stateDivision, setStateDivision] = useState('');
  const [stateDivisionOptions, setStateDivisionOptions] = useState<string[]>([]);
  const [stateDivisionSuggestionsVisible, setStateDivisionSuggestionsVisible] = useState(false);
  const [country, setCountry] = useState('');
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [countrySuggestionsVisible, setCountrySuggestionsVisible] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const [logoUri, setLogoUri] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [logoFileUri, setLogoFileUri] = useState('');
  const [coverFileUri, setCoverFileUri] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'name' | 'businessType' | 'address' | 'city' | 'stateDivision' | 'country', string>>>({});

  const isEditing = Boolean(id);

  const handleBusinessTypeTextChange = async (text: string) => {
    setBusinessType(text);
    setBusinessTypeSuggestionsVisible(text.trim().length > 0);
    if (errors.businessType) setErrors((prev) => ({ ...prev, businessType: undefined }));

    if (!text.trim()) {
      setBusinessTypeOptions([]);
      return;
    }

    const response = await lookupService.getLookup('BUSINESS TYPE', '', text);
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
    setBusinessTypeOptions(lookups.map((lookup) => lookup.value || lookup.code));
  };

  const businessTypeSuggestions = businessTypeOptions;
  const citySuggestions = cityOptions;
  const stateDivisionSuggestions = stateDivisionOptions;
  const countrySuggestions = countryOptions;

  const handleCityTextChange = async (text: string) => {
    setCity(text);
    setCitySuggestionsVisible(text.trim().length > 0);
    if (errors.city) setErrors((prev) => ({ ...prev, city: undefined }));

    if (!text.trim()) {
      setCityOptions([]);
      return;
    }

    const response = await lookupService.getLookup('CITY', '', text);
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
    setCityOptions(lookups.map((lookup) => lookup.value || lookup.code));
  };

  const handleStateDivisionTextChange = async (text: string) => {
    setStateDivision(text);
    setStateDivisionSuggestionsVisible(text.trim().length > 0);
    if (errors.stateDivision) setErrors((prev) => ({ ...prev, stateDivision: undefined }));

    if (!text.trim()) {
      setStateDivisionOptions([]);
      return;
    }

    const response = await lookupService.getLookup('STATE DIVISION', '', text);
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
    setStateDivisionOptions(lookups.map((lookup) => lookup.value || lookup.code));
  };

  const handleCountryTextChange = async (text: string) => {
    setCountry(text);
    setCountrySuggestionsVisible(text.trim().length > 0);
    if (errors.country) setErrors((prev) => ({ ...prev, country: undefined }));

    if (!text.trim()) {
      setCountryOptions([]);
      return;
    }

    const response = await lookupService.getLookup('COUNTRY', '', text);
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
    setCountryOptions(lookups.map((lookup) => lookup.value || lookup.code));
  };

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
      default:
        return 'application/octet-stream';
    }
  };

  useEffect(() => {
    if (!id) return;

    void (async () => {
      const response = await directoryService.getDirectoryById(id);
      if (!response.ok) {
        return;
      }
      const responseJson = await response.json();
      if (responseJson?.success !== true) {
        return;
      }

      const directory: Directory = responseJson.data;
      setName(directory.name ?? '');
      setBusinessType(directory.businessType ?? '');
      setAddress(directory.address ?? '');
      setCity(directory.city ?? '');
      setStateDivision(directory.state ?? '');
      setCountry(directory.country ?? '');
      setPostalCode(directory.postalCode ?? '');
      setPhone(directory.phone ?? '');
      setEmail(directory.email ?? '');
      setGoogleMapUrl(directory.googleMapUrl ?? '');
      setLogoUri(directory.logoUrl ?? '');
      setCoverUri(directory.coverImageUrl ?? '');
      setIsFavorited(directory.isFavorited ?? false);
      setFavoriteCount(directory.favoriteCount ?? 0);
    })();
  }, [id, directoryService]);

  const requestLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.Title.gallery, 'Gallery permission is required.');
      return false;
    }
    return true;
  };

  const pickImage = async (setter: (uri: string) => void, aspect: [number, number]) => {
    const canPick = await requestLibrary();
    if (!canPick) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect,
      mediaTypes: ['images', 'videos'],
    });

    const imageResult = result as ImagePicker.ImagePickerResult;
    const selected = Array.isArray(imageResult.assets) ? imageResult.assets[0] : undefined;
    if (!imageResult.canceled && selected?.uri) {
      setter(selected.uri);
      if (setter === setLogoUri) {
        setLogoFileUri(selected.uri);
      } else if (setter === setCoverUri) {
        setCoverFileUri(selected.uri);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!id) {
      SnackBar.Error('Cannot favorite a directory before it is created.');
      return;
    }

    try {
      const response = await directoryService.toggleFavorite(id);
      if (!response.ok) {
        SnackBar.Error('Unable to toggle favorite. Please try again.');
        return;
      }

      setIsFavorited((prev) => {
        setFavoriteCount((count) => Math.max(0, count + (prev ? -1 : 1)));
        return !prev;
      });
    } catch {
      SnackBar.Error('Unable to toggle favorite. Please try again.');
    }
  };

  const validateForm = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = `${t.Title.businessName} is required.`;
    if (!businessType.trim()) nextErrors.businessType = `${t.Title.businessType} is required.`;
    if (!address.trim()) nextErrors.address = `${t.Title.address} is required.`;
    if (!city) nextErrors.city = `${t.Title.city} is required.`;
    if (!stateDivision) nextErrors.stateDivision = `${t.Title.stateDivision} is required.`;
    if (!country) nextErrors.country = `${t.Title.country} is required.`;

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
        country: country.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        googleMapUrl: googleMapUrl.trim() || undefined,
        logoUrl: !logoFileUri && logoUri ? logoUri : undefined,
        coverImageUrl: !coverFileUri && coverUri ? coverUri : undefined,
        likesCount: 0,
        rating: 0,
        ratingCount: 0,
      };

      const response = isEditing
        ? await directoryService.updateDirectory(id, listing)
        : await directoryService.createDirectory(listing);
      if (!response.ok) {
        SnackBar.Error('Error submitting directory. Invalid response from server.');
        return;
      }

      const responseJson = await response.json();
      if (!responseJson?.success) {
        SnackBar.Error(responseJson?.message || 'Error submitting directory. Failed response.');
        return;
      }

      const directoryId = responseJson.data?.id;
      if (!directoryId) {
        SnackBar.Error('Directory created but returned no identifier.');
        return;
      }

      if (logoFileUri) {
        const uploadLogoResponse = await directoryService.uploadDirectoryLogo(directoryId, {
          uri: logoFileUri,
          name: getFileName(logoFileUri),
          type: getMimeType(logoFileUri),
        });
        if (!uploadLogoResponse.ok) {
          SnackBar.Error(isEditing ? 'Directory updated but logo upload failed.' : 'Directory created but logo upload failed.');
          return;
        }
      }

      if (coverFileUri) {
        const uploadCoverResponse = await directoryService.uploadDirectoryCoverImage(directoryId, {
          uri: coverFileUri,
          name: getFileName(coverFileUri),
          type: getMimeType(coverFileUri),
        });
        if (!uploadCoverResponse.ok) {
          SnackBar.Error(isEditing ? 'Directory updated but cover image upload failed.' : 'Directory created but cover image upload failed.');
          return;
        }
      }

      SnackBar.Success(isEditing ? t.Text.directoryUpdateSuccess ?? 'Directory updated successfully.' : t.Text.directorySubmitSuccess);
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

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.businessName} *</Text>
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
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.businessType} *</Text>
          <AutoCompleteTextInput
            value={businessType}
            onBlur={() => setTimeout(() => setBusinessTypeSuggestionsVisible(false), 300)}
            onTextChange={handleBusinessTypeTextChange}
            isSuggestionsVisible={businessTypeSuggestionsVisible}
            suggestions={businessTypeSuggestions}
            placeholder={t.Title.businessType}
            placeholderTextColor={colors.secondaryText}
            style={[styles.textInput, { borderColor: errors.businessType ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
          />
        </View>

        {isEditing ? (
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Favorite</Text>
            <TouchableOpacity
              style={[styles.favoriteButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={handleToggleFavorite}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={isFavorited ? 'favorite' : 'favorite-border'}
                size={22}
                color={isFavorited ? '#E85D04' : colors.secondaryText}
              />
              <Text style={[styles.favoriteText, { color: colors.text }]}>{favoriteCount}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.address} *</Text>
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
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.city} *</Text>
          <AutoCompleteTextInput
            value={city}
            onBlur={() => setTimeout(() => setCitySuggestionsVisible(false), 300)}
            onTextChange={handleCityTextChange}
            isSuggestionsVisible={citySuggestionsVisible}
            suggestions={citySuggestions}
            placeholder={t.Title.city}
            placeholderTextColor={colors.secondaryText}
            style={[styles.textInput, { borderColor: errors.city ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.stateDivision} *</Text>
          <AutoCompleteTextInput
            value={stateDivision}
            onBlur={() => setTimeout(() => setStateDivisionSuggestionsVisible(false), 300)}
            onTextChange={handleStateDivisionTextChange}
            isSuggestionsVisible={stateDivisionSuggestionsVisible}
            suggestions={stateDivisionSuggestions}
            placeholder={t.Title.stateDivision}
            placeholderTextColor={colors.secondaryText}
            style={[styles.textInput, { borderColor: errors.stateDivision ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.country} *</Text>
          <AutoCompleteTextInput
            value={country}
            onBlur={() => setTimeout(() => setCountrySuggestionsVisible(false), 300)}
            onTextChange={handleCountryTextChange}
            isSuggestionsVisible={countrySuggestionsVisible}
            suggestions={countrySuggestions}
            placeholder={t.Title.country}
            placeholderTextColor={colors.secondaryText}
            style={[styles.textInput, { borderColor: errors.country ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.postalCode}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder={t.Title.postalCode}
            placeholderTextColor={colors.secondaryText}
          />
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
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.email}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder={t.Title.email}
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.googleMapUrl}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={googleMapUrl}
            onChangeText={setGoogleMapUrl}
            placeholder={t.Title.googleMapUrl}
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.logoImage}</Text>
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => void pickImage(setLogoUri, [1, 1])}
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
            onPress={() => void pickImage(setCoverUri, [16, 9])}
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
          <Text style={styles.submitText}>{t.Title.submit} </Text>
        </TouchableOpacity>
      </ScrollView>

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
