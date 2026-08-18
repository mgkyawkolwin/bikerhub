import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Modal, TouchableWithoutFeedback, TextInput, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import SnackBar from '@/components/snackbar';
import { container } from '@/services';
import { LookupService, LookupServiceToken } from '@/services/lookupService';
import type Lookup from '@/models/lookup';
import type { BikeType, MarketplaceFilter } from '@/models/marketplace';

type DropdownField = 'make' | 'model' | 'type' | 'city' | 'country' | null;

function getParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? '';
}

export default function StolenBikeFilterScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const router = useRouter();
  const params = useLocalSearchParams();

  // 1. Unpack primitive param strings to ensure stable useMemo comparison
  const paramMake = getParamValue(params.make);
  const paramModel = getParamValue(params.model);
  const paramModelYear = getParamValue(params.modelYear);
  const paramCc = getParamValue(params.cc);
  const paramType = getParamValue(params.type) as BikeType | undefined;
  const paramCity = getParamValue(params.city);
  const paramCountry = getParamValue(params.country);

  const initialFilter: MarketplaceFilter = useMemo(
    () => ({
      make: paramMake,
      model: paramModel,
      modelYear: paramModelYear,
      cc: paramCc,
      type: paramType,
      city: paramCity,
      country: paramCountry,
    }),
    [
      paramMake,
      paramModel,
      paramModelYear,
      paramCc,
      paramType,
      paramCity,
      paramCountry,
    ],
  );

  // Initialize state once using lazy initializer function
  const [draftFilter, setDraftFilter] = useState<MarketplaceFilter>(() => initialFilter);
  const [activeDropdown, setActiveDropdown] = useState<DropdownField>(null);
  const [makeOptions, setMakeOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [typeOptions, setTypeOptions] = useState<BikeType[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);

  const lookupService = useMemo(
    () => container.resolve<LookupService>(LookupServiceToken),
    [],
  );

  // REMOVED: The useEffect that was calling setDraftFilter(initialFilter) on every render loop

  const fetchLookupValues = useCallback(async (category: string, code = '', value = '') => {
    try {
      const response = await lookupService.getLookup(category, code, value);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again.');
        return [] as string[];
      }

      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return [] as string[];
      }

      const lookups = responseJson.data as Lookup[];
      return lookups.map((lookup) => lookup.value);
    } catch (error) {
      console.error('Lookup request failed', error);
      SnackBar.Error('Unable to load filter values.');
      return [] as string[];
    }
  }, [lookupService]);

  const loadMakeOptions = useCallback(async () => {
    const values = await fetchLookupValues('MAKE');
    setMakeOptions(values);
  }, [fetchLookupValues]);

  // Pass selectedMake directly as a parameter rather than reaching into draftFilter
  const loadModelOptions = useCallback(async (selectedMake: string) => {
    const category = selectedMake || 'MODEL';
    const values = await fetchLookupValues(category);
    setModelOptions(values);
  }, [fetchLookupValues]);

  const loadTypeOptions = useCallback(async () => {
    const values = await fetchLookupValues('BIKE_TYPE');
    setTypeOptions(values as BikeType[]);
  }, [fetchLookupValues]);

  const loadCityOptions = useCallback(async () => {
    const values = await fetchLookupValues('CITY');
    setCityOptions(values);
  }, [fetchLookupValues]);

  const loadCountryOptions = useCallback(async () => {
    const values = await fetchLookupValues('COUNTRY');
    setCountryOptions(values);
  }, [fetchLookupValues]);

  useEffect(() => {
    loadMakeOptions();
    loadTypeOptions();
    loadCityOptions();
    loadCountryOptions();
  }, [loadMakeOptions, loadTypeOptions, loadCityOptions, loadCountryOptions]);

  // Watch draftFilter.make specifically for loading dependent models
  useEffect(() => {
    if (draftFilter.make) {
      loadModelOptions(draftFilter.make);
    } else {
      setModelOptions([]);
    }
  }, [draftFilter.make, loadModelOptions]);

  function handleSelectOption(value: string, field: DropdownField) {
    if (!field) return;

    setDraftFilter((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'make' ? { model: '' } : {}),
    }));

    if (field === 'make') {
      setModelOptions([]);
    }

    setActiveDropdown(null);
  }

  function clearFilter() {
    setDraftFilter({
      make: '',
      model: '',
      modelYear: '',
      priceMin: undefined,
      priceMax: undefined,
      cc: '',
      type: undefined,
      city: '',
      country: '',
    });
  }

  function applyFilter() {
    router.back();
    router.replace({
      pathname: '/marketplace/stolen',
      params: {
        make: draftFilter.make || undefined,
        model: draftFilter.model || undefined,
        modelYear: draftFilter.modelYear || undefined,
        priceMin: draftFilter.priceMin?.toString(),
        priceMax: draftFilter.priceMax?.toString(),
        cc: draftFilter.cc || undefined,
        type: draftFilter.type || undefined,
        city: draftFilter.city || undefined,
        country: draftFilter.country || undefined,
      },
    });
  }

  function getDropdownItems(field: DropdownField) {
    switch (field) {
      case 'make':
        return makeOptions;
      case 'model':
        return modelOptions;
      case 'type':
        return typeOptions;
      case 'city':
        return cityOptions;
      case 'country':
        return countryOptions;
      default:
        return [];
    }
  }

  function getDisplayText(field: DropdownField) {
    if (!field) {
      return t.Title.selectOption;
    }

    return (draftFilter[field] as string) || t.Title.selectOption;
  }

  const dropdownOptions = getDropdownItems(activeDropdown);

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t.Title.filterTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {(
          [
            { label: t.Title.make, field: 'make' as const },
            { label: t.Title.model, field: 'model' as const },
            { label: t.Title.type, field: 'type' as const },
            { label: t.Title.city, field: 'city' as const },
            { label: t.Title.country, field: 'country' as const },
          ] as const
        ).map(({ label, field }) => (
          <View key={field} style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{label}</Text>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => setActiveDropdown(field)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>{getDisplayText(field)}</Text>
              <MaterialIcons name="expand-more" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.modelYear}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={draftFilter.modelYear}
            onChangeText={(text) => setDraftFilter((prev) => ({ ...prev, modelYear: text }))}
            placeholder={t.Title.modelYear}
            placeholderTextColor={colors.secondaryText}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.cc}</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={draftFilter.cc}
            onChangeText={(text) => setDraftFilter((prev) => ({ ...prev, cc: text }))}
            placeholder={t.Title.cc}
            placeholderTextColor={colors.secondaryText}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity style={[styles.clearButton, { borderColor: colors.border }]} onPress={clearFilter}>
            <Text style={[styles.clearText, { color: colors.text }]}>{t.Title.clear}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.accent }]} onPress={applyFilter}>
            <Text style={styles.applyText}>{t.Title.apply}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={Boolean(activeDropdown)} animationType="slide" transparent statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setActiveDropdown(null)}>
          <View style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}> 
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{activeDropdown ? t.Title.selectOption : ''}</Text>
            <TouchableOpacity onPress={() => setActiveDropdown(null)} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetBody}>
            {dropdownOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.sheetItem, { borderBottomColor: colors.border }]}
                onPress={() => activeDropdown && handleSelectOption(option, activeDropdown)}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 42,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  form: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 14,
  },
  dropdownText: {
    fontSize: 15,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 15,
    fontWeight: '700',
  },
  applyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetOverlay: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '65%',
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