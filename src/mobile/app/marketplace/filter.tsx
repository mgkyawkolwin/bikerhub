import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Modal, TouchableWithoutFeedback, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import type { BikeType, MarketplaceFilter } from '@/models/marketplace';

const MAKES = ['Yamaha', 'Honda', 'Royal Enfield', 'Kawasaki', 'BMW', 'Suzuki', 'Ducati', 'KTM', 'Triumph'] as const;
const MODELS = ['MT-15', 'CB500X', 'Classic 350', 'Z650', 'R NineT', 'V-Strom 650', 'Monster 797', 'CB300R', '390 Duke', 'Tiger 900'] as const;
const LOCATIONS = ['Yangon', 'Mandalay', 'Naypyitaw', 'Bago', 'Taunggyi', 'Mawlamyine', 'Pathein', 'Pyay', 'Sagaing', 'Hpa-An'] as const;
const TYPES: BikeType[] = ['Cruiser', 'Sport', 'Standard', 'Adventure', 'Touring', 'Custom'];

type DropdownField = 'make' | 'model' | 'type' | 'location' | null;

function getParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? '';
}

export default function MarketplaceFilterScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialFilter: MarketplaceFilter = useMemo(
    () => ({
      make: getParamValue(params.make),
      model: getParamValue(params.model),
      modelYear: getParamValue(params.modelYear),
      priceMin: params.priceMin ? Number(getParamValue(params.priceMin)) : undefined,
      priceMax: params.priceMax ? Number(getParamValue(params.priceMax)) : undefined,
      cc: getParamValue(params.cc),
      type: getParamValue(params.type) as BikeType | undefined,
      location: getParamValue(params.location),
    }),
    [params],
  );

  const [draftFilter, setDraftFilter] = useState<MarketplaceFilter>(initialFilter);
  const [activeDropdown, setActiveDropdown] = useState<DropdownField>(null);

  useEffect(() => {
    setDraftFilter(initialFilter);
  }, [initialFilter]);

  const { colors } = useThemeContext();

  function handleSelectOption(value: string, field: DropdownField) {
    if (!field) return;

    setDraftFilter((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      location: '',
    });
  }

  function applyFilter() {
    router.back();
    router.replace({
      pathname: '/marketplace',
      params: {
        make: draftFilter.make || undefined,
        model: draftFilter.model || undefined,
        modelYear: draftFilter.modelYear || undefined,
        priceMin: draftFilter.priceMin?.toString(),
        priceMax: draftFilter.priceMax?.toString(),
        cc: draftFilter.cc || undefined,
        type: draftFilter.type || undefined,
        location: draftFilter.location || undefined,
      },
    });
  }

  function getDropdownItems(field: DropdownField) {
    switch (field) {
      case 'make':
        return MAKES;
      case 'model':
        return MODELS;
      case 'location':
        return LOCATIONS;
      case 'type':
        return TYPES;
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
        <ThemedText style={[styles.title, { color: colors.text }]}>{t.Title.filterTitle}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {(
          [
            { label: t.Title.make, field: 'make' as const },
            { label: t.Title.model, field: 'model' as const },
            { label: t.Title.location, field: 'location' as const },
            { label: t.Title.type, field: 'type' as const },
          ] as const
        ).map(({ label, field }) => (
          <View key={field} style={styles.fieldGroup}>
            <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{label}</ThemedText>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => setActiveDropdown(field)}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.dropdownText, { color: colors.text }]}>{getDisplayText(field)}</ThemedText>
              <MaterialIcons name="expand-more" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.modelYear}</ThemedText>
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
          <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.cc}</ThemedText>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={draftFilter.cc}
            onChangeText={(text) => setDraftFilter((prev) => ({ ...prev, cc: text }))}
            placeholder={t.Title.cc}
            placeholderTextColor={colors.secondaryText}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.priceRange}</ThemedText>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.textInput, styles.halfInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={draftFilter.priceMin != null ? draftFilter.priceMin.toString() : ''}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                setDraftFilter((prev) => ({ ...prev, priceMin: cleaned ? Number(cleaned) : undefined }));
              }}
              placeholder={t.Title.priceRange}
              placeholderTextColor={colors.secondaryText}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.textInput, styles.halfInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={draftFilter.priceMax != null ? draftFilter.priceMax.toString() : ''}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                setDraftFilter((prev) => ({ ...prev, priceMax: cleaned ? Number(cleaned) : undefined }));
              }}
              placeholder={t.Title.priceRangeMax}
              placeholderTextColor={colors.secondaryText}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity style={[styles.clearButton, { borderColor: colors.border }]} onPress={clearFilter}>
            <ThemedText style={[styles.clearText, { color: colors.text }]}>{t.Title.clear}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.accent }]} onPress={applyFilter}>
            <ThemedText style={styles.applyText}>{t.Title.apply}</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={Boolean(activeDropdown)} animationType="slide" transparent statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setActiveDropdown(null)}>
          <View style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}> 
          <View style={styles.sheetHeader}>
            <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>{activeDropdown ? t.Title.selectOption : ''}</ThemedText>
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
