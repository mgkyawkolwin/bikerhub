import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { ConfigServiceToken } from '@/services/configService';
import type { ConfigService } from '@/services/configService';
import SnackBar from '@/components/snackbar';

type DropdownField = 'businessType' | null;

type LookupItem = {
  id: string;
  category: string;
  code: string;
  value?: string;
};

const getParamValue = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

export default function DirectorySearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const configService = useMemo(() => container.resolve<ConfigService>(ConfigServiceToken), []);

  const [businessTypes, setBusinessTypes] = useState<LookupItem[]>([]);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>(() => getParamValue(params.businessType));
  const selectedBusinessTypeParam = getParamValue(params.businessType);
  const [activeDropdown, setActiveDropdown] = useState<DropdownField>(null);

  useEffect(() => {
    void (async () => {
      const response = await configService.getBusinessTypes();
      if (!response.ok) {
        SnackBar.Error("Failed to fetch business types");
        return;
      }
      const responseJson = await response.json();
      if (responseJson?.success !== true) {
        SnackBar.Error("Failed to fetch business types");
        return;
      }
      const types = responseJson.data ?? [];
      setBusinessTypes(types);
    })();
  }, [configService]);

  useEffect(() => {
    setSelectedBusinessType(selectedBusinessTypeParam);
  }, [selectedBusinessTypeParam]);

  const dropdownItems = useMemo(
    () => ({
      businessType: businessTypes,
    }),
    [businessTypes],
  );

  const getDisplayText = (field: DropdownField) => {
    if (field === 'businessType') {
      if (!selectedBusinessType) return t.Title.businessType;
      const selected = businessTypes.find((item) => item.code === selectedBusinessType || item.id === selectedBusinessType);
      return selected?.value || selected?.code || selectedBusinessType;
    }
    return '';
  };

  const selectOption = (option: LookupItem, field: DropdownField) => {
    if (field === 'businessType') {
      setSelectedBusinessType(option.code);
    }
    setActiveDropdown(null);
  };

  const clearFilters = () => {
    setSelectedBusinessType('');
    router.replace({ pathname: '/directory/directory' });
  };

  const applyFilters = () => {
    router.replace({
      pathname: '/directory/directory',
      params: {
        businessType: selectedBusinessType || undefined,
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t.Title.directorySearch}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{t.Title.businessType}</Text>
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => setActiveDropdown('businessType')}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>{getDisplayText('businessType')}</Text>
            <MaterialIcons name="expand-more" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.clearButton, { borderColor: colors.border }]} onPress={clearFilters} activeOpacity={0.8}>
            <Text style={[styles.clearText, { color: colors.text }]}>{t.Title.clear} </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.accent }]} onPress={applyFilters} activeOpacity={0.8}>
            <Text style={styles.applyText}>{t.Title.apply} </Text>
          </TouchableOpacity>
        </View>
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
                key={option.id}
                style={[styles.sheetItem, { borderBottomColor: colors.border }]}
                onPress={() => activeDropdown && selectOption(option, activeDropdown)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetItemText, { color: colors.text }]}>{option.value || option.code}</Text>
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
  title: { fontSize: 18, fontWeight: '700' },
  headerSpacer: { width: 22 },
  form: { paddingHorizontal: 16, gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  dropdownText: { fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  clearButton: { flex: 1, paddingVertical: 16, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  applyButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 15, fontWeight: '700' },
  applyText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  listTitle: { fontSize: 16, fontWeight: '700' },
  listMeta: { fontSize: 12 },
  list: { paddingBottom: 48, gap: 12 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: 16, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardSummary: { fontSize: 14, lineHeight: 20 },
  cardAddress: { fontSize: 13, lineHeight: 18 },
  sheetOverlay: { flex: 1 },
  sheet: { maxHeight: '50%', borderTopWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetBody: { paddingHorizontal: 16 },
  sheetItem: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetItemText: { fontSize: 14 },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
